import { useEffect, useState, type ChangeEvent } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import { Table } from "react-bootstrap";
import axios from "axios";

interface Post {
  id: number;
  title: string;
  image: string;
  content?: string;
  date: string;
  status: boolean;
}

export default function ListPost() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [show, setShow] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [notFound, setNotFound] = useState<boolean>(false);

  const [post, setPost] = useState<Post>({
    id: 0,
    title: "",
    image: "",
    content: "",
    date:
      new Date().getDate() +
      "/" +
      (new Date().getMonth() + 1) +
      "/" +
      new Date().getFullYear(),
    status: true,
  });

  const handleClose = () => {
    setShow(false);
    setIsEdit(false);
    setEditId(null);
    resetForm();
  };

  const handleShow = () => setShow(true);

  const resetForm = () => {
    setPost({
      id: 0,
      title: "",
      image: "",
      content: "",
      date:
        new Date().getDate() +
        "/" +
        (new Date().getMonth() + 1) +
        "/" +
        new Date().getFullYear(),
      status: true,
    });
  };

  async function getAllPosts() {
    try {
      const response = await axios.get("http://localhost:8080/posts");
      setPosts(response.data);
      setNotFound(response.data.length === 0);
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    getAllPosts();
  }, []);

  async function handleSearch(keyword: string) {
    setSearchTerm(keyword);
    if (!keyword.trim()) {
      getAllPosts();
      return;
    }
    try {
      const response = await axios.get(
        `http://localhost:8080/posts?title_like=${keyword}`
      );
      setPosts(response.data);
      setNotFound(response.data.length === 0);
    } catch (err) {
      console.log(err);
    }
  }

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, files } = e.target as any;
    if (type === "file" && files.length > 0) {
      setPost({ ...post, [name]: URL.createObjectURL(files[0]) });
    } else {
      setPost({ ...post, [name]: value });
    }
  };

  const validate = (): string | null => {
    if (!post.title.trim() || !post.image.trim() || !post.content?.trim()) {
      return "Tên bài viết, hình ảnh và nội dung không được để trống!";
    }
    const duplicate = posts.find(
      (p) => p.title === post.title && p.id !== editId
    );
    if (duplicate) {
      return "Tên bài viết đã tồn tại!";
    }
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      alert(error);
      return;
    }
    try {
      if (isEdit && editId !== null) {
        await axios.put(`http://localhost:8080/posts/${editId}`, post);
      } else {
        await axios.post("http://localhost:8080/posts", post);
      }
      handleClose();
      getAllPosts();
    } catch (err) {
      console.log(err);
    }
  };

  async function handleSetStatus(id: number) {
    try {
      const postSet = posts.find((e) => e.id === id);
      if (postSet) {
        await axios.patch(`http://localhost:8080/posts/${id}`, {
          status: !postSet.status,
        });
      }
      getAllPosts();
    } catch (err) {
      console.log(err);
    }
  }

  const handleEdit = (p: Post) => {
    setPost(p);
    setIsEdit(true);
    setEditId(p.id);
    handleShow();
  };

  return (
    <div>
      <h1>Danh sách bài viết</h1>
      <input
        type="text"
        placeholder="Tìm kiếm bài viết theo tên"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <select>
        <option value="">Lựa chọn</option>
        <option value="true">Đã xuất bản</option>
        <option value="false">Chưa xuất bản</option>
      </select>
      <Button variant="primary" onClick={handleShow}>
        Thêm bài viết
      </Button>

      {/* Modal thêm/sửa */}
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
            {isEdit ? "Cập nhật bài viết" : "Thêm bài viết mới"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Tên bài viết</Form.Label>
              <Form.Control
                type="text"
                value={post.title}
                onChange={handleChange}
                name="title"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Hình ảnh</Form.Label>
              <Form.Control type="file" onChange={handleChange} name="image" />
              {post.image && (
                <img src={post.image} alt="" style={{ width: "100px" }} />
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nội dung bài viết</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={post.content}
                onChange={handleChange}
                name="content"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {isEdit ? "Cập nhật" : "Lưu bài viết"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>STT</th>
            <th>Tiêu đề</th>
            <th>Hình ảnh</th>
            <th>Ngày viết</th>
            <th style={{ minWidth: "180px" }}>Trạng thái</th>
            <th>Chức năng</th>
          </tr>
        </thead>
        {notFound ? (
          <p
            style={{
              margin: "20px",
              color: "gray",
            }}
          >
            Không có kết quả tìm kiếm
          </p>
        ) : (
          <tbody>
            {posts.map((post, index) => (
              <tr key={post.id}>
                <td>{index + 1}</td>
                <td>{post.title}</td>
                <td>
                  <img style={{ width: "60px" }} src={post.image} alt="" />
                </td>
                <td>{post.date}</td>
                <td>{post.status ? "Đã xuất bản" : "Chưa xuất bản"}</td>
                <td style={{ display: "flex", justifyContent: "space-around" }}>
                  <Button
                    style={{ minWidth: "82px" }}
                    onClick={() => handleSetStatus(post.id)}
                    variant={post.status ? "warning" : "light"}
                  >
                    {post.status ? "Chặn" : "Bỏ chặn"}
                  </Button>
                  <Button variant="primary" onClick={() => handleEdit(post)}>
                    Sửa
                  </Button>
                  <Button variant="danger">Xóa</Button>
                </td>
              </tr>
            ))}
          </tbody>
        )}
      </Table>
    </div>
  );
}
