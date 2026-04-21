import { useState, useEffect } from "react";
import axios from "axios";

const VITE_API_URL = import.meta.env.VITE_API_URL;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${VITE_API_URL}/users`, { headers });
        setUsers(response.data.data);
        // console.log(response.data)
      } catch (error) {
        setError(error.message);
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h3 className="page-title"> Data Users </h3>
      </div>
      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Table User</h4>
              {/* <p className="card-description"> Add User </p> */}
              <div className="card-description">
                <button className=" btn btn-gradient-primary btn-sm">
                  Add User
                </button>
              </div>
             
              <div className="table-responsive">
              {error ? (
                <p>Terjadi kesalahan: {error}</p>
              ) : (
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th> # </th>
                      <th> Name </th>
                      <th> Username </th>
                      <th> Role </th>
                      <th> Status </th>
                      <th> Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((user, index) => (
                        <tr key={user.id}>
                          <td>{index + 1}</td>
                          <td>{user.name}</td>
                          <td>{user.username}</td>
                          <td>{user.role} </td>
                          <td>
                            {user.enabled === 1 ? (
                              <span className="badge badge-success">
                                Active
                              </span>
                            ) : (
                              <span className="badge badge-danger">Non Active</span>
                            )}
                          </td>
                          <td style={{ display: 'flex', justifyContent: 'center' }}>
                            <button className="btn btn-gradient-warning btn-sm">
                              Edit
                            </button>
                            <button className="btn btn-gradient-danger btn-sm">
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5">Loading users...</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
