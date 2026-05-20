import { uploadEmployeePhoto } from "./employeeService";
import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  downloadSalarySlip,
} from "./employeeService";

const emptyForm = { name: "", email: "", department: "", salary: "" };
const COLORS = ["#4f8ef7", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const PAGE_SIZE = 5;

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("employees");
  const [currentPage, setCurrentPage] = useState(1);
  const [deptFilter, setDeptFilter] = useState("All");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    const res = await getAllEmployees();
    setEmployees(res.data);
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      const updated = { ...form, id: editingId };
      setEmployees((prev) => prev.map((emp) => (emp.id === editingId ? updated : emp)));
      showMessage("Employee updated successfully!", "success");
      setForm(emptyForm);
      setEditingId(null);
      await updateEmployee(editingId, form);
      fetchEmployees();
    } else {
      const temp = { ...form, id: "temp-" + Date.now() };
      setEmployees((prev) => [...prev, temp]);
      showMessage("Employee added successfully!", "success");
      setForm(emptyForm);
      setEditingId(null);
      await createEmployee(form);
      fetchEmployees();
    }
  };

  const handleEdit = (emp) => {
    setForm({ name: emp.name, email: emp.email, department: emp.department, salary: emp.salary });
    setEditingId(emp.id);
    setActiveTab("employees");
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      showMessage("Employee deleted!", "error");
      await deleteEmployee(id);
      fetchEmployees();
    }
  };

  const handleCancel = () => { setForm(emptyForm); setEditingId(null); };

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Department", "Salary"];
    const rows = employees.map((e) => [e.name, e.email, e.department, e.salary]);
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employees.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const allDepartments = ["All", ...new Set(employees.map((e) => e.department))];

  const filtered = employees.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || e.department === deptFilter;
    const matchMin = minSalary === "" || e.salary >= Number(minSalary);
    const matchMax = maxSalary === "" || e.salary <= Number(maxSalary);
    return matchSearch && matchDept && matchMin && matchMax;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchChange = (e) => { setSearch(e.target.value); setCurrentPage(1); };
  const handleDeptChange = (e) => { setDeptFilter(e.target.value); setCurrentPage(1); };
  const handleMinSalary = (e) => { setMinSalary(e.target.value); setCurrentPage(1); };
  const handleMaxSalary = (e) => { setMaxSalary(e.target.value); setCurrentPage(1); };

  const clearFilters = () => {
    setSearch(""); setDeptFilter("All");
    setMinSalary(""); setMaxSalary("");
    setCurrentPage(1);
  };

  const departments = [...new Set(employees.map((e) => e.department))].length;

  const barData = employees.map((e) => ({
    name: e.name.split(" ")[0],
    salary: Number(e.salary),
  }));

  const deptMap = {};
  employees.forEach((e) => { deptMap[e.department] = (deptMap[e.department] || 0) + 1; });
  const pieData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

  const handlePhotoUpload = async (empId, file) => {
    if(!file) return;

    const updated = await uploadEmployeePhoto(empId, file);
    setEmployees((prev) =>
        prev.map((emp) => (emp.id === empId ? {...emp, photoUrl: updated.photoUrl} :emp))
    );

    showMessage("Photo Uploaded Successfully!", "success");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Responsive CSS */}
      <style>{`
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .filter-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 10px; }
        .table-wrap { overflow-x: auto; }
        .hide-mobile { display: table-cell; }
        .nav-tabs { display: flex; gap: 8px; }
        .mobile-menu { display: none; }
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .form-grid { grid-template-columns: 1fr; }
          .filter-grid { grid-template-columns: 1fr; }
          .hide-mobile { display: none; }
          .nav-tabs { display: none; }
          .mobile-menu { display: block; }
          .mobile-nav { display: flex; flex-direction: column; gap: 8px; padding: 12px 20px; background: #16213e; }
          .page-btn-text { display: none; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Navbar */}
      <div style={{ background: "#1a1a2e", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "38px", height: "38px", background: "#4f8ef7", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "18px" }}>E</div>
          <span style={{ color: "white", fontSize: "16px", fontWeight: "600" }}>Employee Management</span>
        </div>

        {/* Desktop tabs */}
        <div className="nav-tabs">
          <button onClick={() => setActiveTab("employees")} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "500", fontSize: "13px", background: activeTab === "employees" ? "#4f8ef7" : "transparent", color: activeTab === "employees" ? "white" : "#aaa" }}>
            Employees
          </button>
          <button onClick={() => setActiveTab("dashboard")} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "500", fontSize: "13px", background: activeTab === "dashboard" ? "#4f8ef7" : "transparent", color: activeTab === "dashboard" ? "white" : "#aaa" }}>
            Dashboard
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: "none", border: "none", color: "white", fontSize: "22px", cursor: "pointer" }}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile nav dropdown */}
      {menuOpen && (
        <div className="mobile-nav">
          <button onClick={() => { setActiveTab("employees"); setMenuOpen(false); }}
            style={{ padding: "10px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "500", fontSize: "14px", background: activeTab === "employees" ? "#4f8ef7" : "#1a1a2e", color: "white", textAlign: "left" }}>
            👥 Employees
          </button>
          <button onClick={() => { setActiveTab("dashboard"); setMenuOpen(false); }}
            style={{ padding: "10px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "500", fontSize: "14px", background: activeTab === "dashboard" ? "#4f8ef7" : "#1a1a2e", color: "white", textAlign: "left" }}>
            📊 Dashboard
          </button>
        </div>
      )}

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px 16px" }}>

        {/* Alert */}
        {message.text && (
          <div style={{ background: message.type === "success" ? "#d1fae5" : "#fee2e2", color: message.type === "success" ? "#065f46" : "#991b1b", padding: "12px 18px", borderRadius: "8px", marginBottom: "20px", fontWeight: "500", fontSize: "14px" }}>
            {message.type === "success" ? "✓" : "✕"} {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: "20px" }}>
          <div style={{ background: "white", borderRadius: "10px", padding: "16px 18px", borderLeft: "4px solid #4f8ef7" }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>Total Employees</p>
            <p style={{ margin: "6px 0 0", fontSize: "24px", fontWeight: "700", color: "#1a1a2e" }}>{employees.length}</p>
          </div>
          <div style={{ background: "white", borderRadius: "10px", padding: "16px 18px", borderLeft: "4px solid #22c55e" }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>Departments</p>
            <p style={{ margin: "6px 0 0", fontSize: "24px", fontWeight: "700", color: "#1a1a2e" }}>{departments}</p>
          </div>
          <div onClick={exportToCSV} style={{ background: "white", borderRadius: "10px", padding: "16px 18px", borderLeft: "4px solid #8b5cf6", cursor: "pointer" }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>Export Data</p>
            <p style={{ margin: "6px 0 0", fontSize: "24px", fontWeight: "700", color: "#8b5cf6" }}>⬇ CSV</p>
          </div>
        </div>

        {/* ========== EMPLOYEES TAB ========== */}
        {activeTab === "employees" && (
          <>
            {/* Form */}
            <div style={{ background: "white", borderRadius: "10px", padding: "20px", marginBottom: "20px", border: "1px solid #e2e8f0" }}>
              <h2 style={{ margin: "0 0 16px", color: "#1a1a2e", fontSize: "15px", fontWeight: "600" }}>
                {editingId ? "✏️ Edit Employee" : "➕ Add New Employee"}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  {[
                    { name: "name", placeholder: "Full Name", type: "text" },
                    { name: "email", placeholder: "Email Address", type: "email" },
                    { name: "department", placeholder: "Department", type: "text" },
                    { name: "salary", placeholder: "Salary (₹)", type: "number" },
                  ].map((field) => (
                    <input key={field.name} name={field.name} type={field.type}
                      placeholder={field.placeholder} value={form[field.name]}
                      onChange={handleChange} required
                      style={{ padding: "11px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box", color: "#1a1a2e" }} />
                  ))}
                </div>
                <div style={{ marginTop: "14px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button type="submit" style={{ padding: "11px 24px", background: "#4f8ef7", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>
                    {editingId ? "Update Employee" : "+ Add Employee"}
                  </button>
                  {editingId && (
                    <button type="button" onClick={handleCancel}
                      style={{ padding: "11px 20px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Search + Filters */}
            <div style={{ background: "white", borderRadius: "10px", padding: "16px 18px", marginBottom: "16px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontWeight: "600", color: "#1a1a2e", fontSize: "14px" }}>🔍 Search & Filter</span>
                <button onClick={clearFilters}
                  style={{ background: "#f1f5f9", color: "#64748b", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>
                  Clear
                </button>
              </div>
              <div className="filter-grid">
                <input placeholder="Search by name or department..." value={search} onChange={handleSearchChange}
                  style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", outline: "none", color: "#1a1a2e", width: "100%", boxSizing: "border-box" }} />
                <select value={deptFilter} onChange={handleDeptChange}
                  style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", outline: "none", color: "#1a1a2e", background: "white", width: "100%", boxSizing: "border-box" }}>
                  {allDepartments.map((d) => <option key={d}>{d}</option>)}
                </select>
                <input placeholder="Min Salary" type="number" value={minSalary} onChange={handleMinSalary}
                  style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", outline: "none", color: "#1a1a2e", width: "100%", boxSizing: "border-box" }} />
                <input placeholder="Max Salary" type="number" value={maxSalary} onChange={handleMaxSalary}
                  style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", outline: "none", color: "#1a1a2e", width: "100%", boxSizing: "border-box" }} />
              </div>
            </div>

            {/* Table */}
            <div style={{ background: "white", borderRadius: "10px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f4f8" }}>
                <span style={{ fontWeight: "600", color: "#1a1a2e", fontSize: "14px" }}>
                  All Employees ({filtered.length})
                </span>
              </div>
              {paginated.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>No employees found!</div>
              ) : (
                <div className="table-wrap">
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        <th style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: "500" }}>Name</th>
                        <th className="hide-mobile" style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: "500" }}>Email</th>
                        <th style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: "500" }}>Dept</th>
                        <th style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: "500" }}>Salary</th>
                        <th style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: "500" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((emp, i) => (
                        <tr key={emp.id} style={{ borderTop: "1px solid #f0f4f8", background: i % 2 === 0 ? "white" : "#fafafa" }}>

                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              {emp.photoUrl ? (
                                <img
                                  src={emp.photoUrl}
                                  alt={emp.name}
                                  style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    border: "2px solid #e2e8f0"
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "50%",
                                  background: "#4f8ef7",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  fontWeight: "600",
                                  fontSize: "14px"
                                }}>
                                  {emp.name ? emp.name.charAt(0).toUpperCase() : "?"}
                                </div>
                              )}
                              <div>
                                <p style={{ margin: 0, fontWeight: "500", color: "#1a1a2e", fontSize: "13px" }}>
                                  {emp.name}
                                </p>
                                <label style={{ fontSize: "11px", color: "#4f8ef7", cursor: "pointer" }}>
                                  📷 Upload
                                  <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={(e) => handlePhotoUpload(emp.id, e.target.files[0])}
                                  />
                                </label>
                              </div>
                            </div>
                          </td>

                          <td className="hide-mobile" style={{ padding: "12px 14px", color: "#64748b" }}>{emp.email}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ background: "#eff6ff", color: "#3b82f6", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "500", whiteSpace: "nowrap" }}>{emp.department}</span>
                          </td>
                          <td style={{ padding: "12px 14px", color: "#1a1a2e", fontWeight: "500", whiteSpace: "nowrap" }}>₹{Number(emp.salary).toLocaleString()}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              <button onClick={() => handleEdit(emp)}
                                style={{ background: "#fef3c7", color: "#d97706", border: "none", padding: "5px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "500" }}>
                                Edit
                              </button>
                              <button onClick={() => handleDelete(emp.id)}
                                style={{ background: "#fee2e2", color: "#ef4444", border: "none", padding: "5px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "500" }}>
                                Del
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await downloadSalarySlip(emp.id, emp.name);
                                  } catch (e) {
                                    alert("Failed to download salary slip. Please try again.");
                                  }
                                }}
                                style={{ background: "#f0fdf4", color: "#22c55e", border: "none", padding: "5px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "500" }}>
                                PDF
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ padding: "14px 18px", borderTop: "1px solid #f0f4f8", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </span>
                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                    <button onClick={() => handlePageChange(safePage - 1)} disabled={safePage === 1}
                      style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #e2e8f0", background: safePage === 1 ? "#f8fafc" : "white", color: safePage === 1 ? "#cbd5e1" : "#1a1a2e", cursor: safePage === 1 ? "not-allowed" : "pointer", fontSize: "12px" }}>
                      ← <span className="page-btn-text">Prev</span>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button key={page} onClick={() => handlePageChange(page)}
                        style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #e2e8f0", background: safePage === page ? "#4f8ef7" : "white", color: safePage === page ? "white" : "#1a1a2e", cursor: "pointer", fontSize: "12px", fontWeight: safePage === page ? "600" : "400", minWidth: "32px" }}>
                        {page}
                      </button>
                    ))}
                    <button onClick={() => handlePageChange(safePage + 1)} disabled={safePage === totalPages}
                      style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #e2e8f0", background: safePage === totalPages ? "#f8fafc" : "white", color: safePage === totalPages ? "#cbd5e1" : "#1a1a2e", cursor: safePage === totalPages ? "not-allowed" : "pointer", fontSize: "12px" }}>
                      <span className="page-btn-text">Next</span> →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ========== DASHBOARD TAB ========== */}
        {activeTab === "dashboard" && (
          <div style={{ display: "grid", gap: "20px" }}>
            <div style={{ background: "white", borderRadius: "10px", padding: "20px", border: "1px solid #e2e8f0" }}>
              <h2 style={{ margin: "0 0 16px", color: "#1a1a2e", fontSize: "15px", fontWeight: "600" }}>📊 Salary by Employee</h2>
              {employees.length === 0 ? (
                <p style={{ textAlign: "center", color: "#94a3b8" }}>No data yet — add employees first!</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Salary"]} />
                    <Bar dataKey="salary" fill="#4f8ef7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div style={{ background: "white", borderRadius: "10px", padding: "20px", border: "1px solid #e2e8f0" }}>
              <h2 style={{ margin: "0 0 16px", color: "#1a1a2e", fontSize: "15px", fontWeight: "600" }}>🥧 Employees by Department</h2>
              {pieData.length === 0 ? (
                <p style={{ textAlign: "center", color: "#94a3b8" }}>No data yet — add employees first!</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}