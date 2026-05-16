import { useState, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
}from "recharts";
import {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "./employeeService";

const emptyForm = { name: "", email: "", department: "", salary: "" };
const COLORS = ["#4f8ef7", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const  PAGE_SIZE = 5;

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

  useEffect(() => { fetchEmployees(); }, []);
  //fetch employees
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
      await updateEmployee(editingId, form);
      showMessage("Employee updated successfully!", "success");
    } else {
      await createEmployee(form);
      showMessage("Employee added successfully!", "success");
    }
    setForm(emptyForm);
    setEditingId(null);
    fetchEmployees();
  };

  const handleEdit = (emp) => {
    setForm({ name: emp.name, email: emp.email, department: emp.department, salary: emp.salary });
    setEditingId(emp.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      await deleteEmployee(id);
      showMessage("Employee deleted!", "error");
      fetchEmployees();
    }
  };

  const handleCancel = () => { setForm(emptyForm); setEditingId(null); };

  const exportToCSV = () =>{
        const headers = ["Name","Email","Department","Salary"];
        const rows = employees.map((e) => [e.name, e.email, e.department, e.salary]);
        const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
        const blob = new Blob([csvContent], {type: "text/csv"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "employees.csv";
        a.click();
        URL.revokeObjectURL(url);
  };
  // ALl unique departments for dropdown
  const allDepartments = ["All",...new Set(employees.map((e) => e.department))];
  //Filtering logic
  const filtered = employees.filter((e) => {
      const matchSearch =
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.department.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter == "All" || e.department == deptFilter;
      const matchMin = minSalary == "" || e.salary >= Number(minSalary);
      const matchMax = maxSalary == "" || e.salary <= Number(maxSalary);

      return matchSearch && matchDept && matchMin && matchMax;
  });

  //Pagination Logic
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const HandlePageChange = (page) =>{
      setCurrentPage(page);
      window.scrollTo({top : 0, behavior: "smooth"});
  };

  const handleSearchChange = (e) => {setSearch(e.target.value); setCurrentPage(1); };
  const handleDeptChange = (e) => {setDeptFilter(e.target.value); setCurrentPage(1); };
  const handleMinSalary = (e) => {setMinSalary(e.target.value); setCurrentPage(1); };
  const handleMaxSalary = (e) => {setMaxSalary(e.target.value); setCurrentPage(1); };

  const clearFilters = () => {
      setSearch("");
      setDeptFilter("All");
      setMinSalary("");
      setMaxSalary("");
      setCurrentPage(1);
  };

  const departments = [...new Set(employees.map((e) => e.department))].length;

  //Chart Data
  const barData = employees.map((e) => ({
    name: e.name.split(" ")[0],
    salary: Number(e.salary),
  }));

  const deptMap = {};
  employees.forEach((e) => {
    deptMap[e.department] = (deptMap[e.department] || 0) + 1;
  });
  const pieData = Object.entries(deptMap).map(([name, value]) => ({name, value}));

  return (
      <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Segoe UI', sans-serif" }}>

        {/* Navbar */}
        <div style={{ background: "#1a1a2e", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "38px", height: "38px", background: "#4f8ef7", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "18px" }}>E</div>
            <span style={{ color: "white", fontSize: "18px", fontWeight: "600" }}>Employee Management</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setActiveTab("employees")} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "500", fontSize: "13px", background: activeTab === "employees" ? "#4f8ef7" : "transparent", color: activeTab === "employees" ? "white" : "#aaa" }}>
              Employees
            </button>
            <button onClick={() => setActiveTab("dashboard")} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "500", fontSize: "13px", background: activeTab === "dashboard" ? "#4f8ef7" : "transparent", color: activeTab === "dashboard" ? "white" : "#aaa" }}>
              Dashboard
            </button>
          </div>
        </div>

        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px 20px" }}>

          {/* Alert */}
          {message.text && (
            <div style={{ background: message.type === "success" ? "#d1fae5" : "#fee2e2", color: message.type === "success" ? "#065f46" : "#991b1b", padding: "12px 18px", borderRadius: "8px", marginBottom: "20px", fontWeight: "500", fontSize: "14px" }}>
              {message.type === "success" ? "✓" : "✕"} {message.text}
            </div>
          )}

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "24px" }}>
            {[
              { label: "Total Employees", value: employees.length, color: "#4f8ef7" },
              { label: "Departments", value: departments, color: "#22c55e" },
            ].map((stat) => (
              <div key={stat.label} style={{ background: "white", borderRadius: "10px", padding: "18px 20px", borderLeft: `4px solid ${stat.color}` }}>
                <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>{stat.label}</p>
                <p style={{ margin: "6px 0 0", fontSize: "26px", fontWeight: "700", color: "#1a1a2e" }}>{stat.value}</p>
              </div>
            ))}
            <div onClick={exportToCSV} style={{ background: "white", borderRadius: "10px", padding: "18px 20px", borderLeft: "4px solid #8b5cf6", cursor: "pointer" }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>Export Data</p>
              <p style={{ margin: "6px 0 0", fontSize: "26px", fontWeight: "700", color: "#8b5cf6" }}>⬇ CSV</p>
            </div>
          </div>

          {/* ========== EMPLOYEES TAB ========== */}
          {activeTab === "employees" && (
            <>
              {/* Form */}
              <div style={{ background: "white", borderRadius: "10px", padding: "24px", marginBottom: "24px", border: "1px solid #e2e8f0" }}>
                <h2 style={{ margin: "0 0 18px", color: "#1a1a2e", fontSize: "16px", fontWeight: "600" }}>
                  {editingId ? "✏️ Edit Employee" : "➕ Add New Employee"}
                </h2>
                <form onSubmit={handleSubmit}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {[
                      { name: "name", placeholder: "Full Name", type: "text" },
                      { name: "email", placeholder: "Email Address", type: "email" },
                      { name: "department", placeholder: "Department", type: "text" },
                      { name: "salary", placeholder: "Salary (₹)", type: "number" },
                    ].map((field) => (
                      <input key={field.name} name={field.name} type={field.type} placeholder={field.placeholder} value={form[field.name]} onChange={handleChange} required
                        style={{ padding: "11px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box", color: "#1a1a2e" }} />
                    ))}
                  </div>
                  <div style={{ marginTop: "14px", display: "flex", gap: "10px" }}>
                    <button type="submit" style={{ padding: "11px 28px", background: "#4f8ef7", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>
                      {editingId ? "Update Employee" : "+ Add Employee"}
                    </button>
                    {editingId && (
                      <button type="button" onClick={handleCancel} style={{ padding: "11px 24px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Search + Filters */}
              <div style={{ background: "white", borderRadius: "10px", padding: "18px 20px", marginBottom: "16px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontWeight: "600", color: "#1a1a2e", fontSize: "14px" }}>🔍 Search & Filter</span>
                  <button onClick={clearFilters} style={{ background: "#f1f5f9", color: "#64748b", border: "none", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>
                    Clear Filters
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "10px" }}>
                  <input
                    placeholder="Search by name or department..."
                    value={search}
                    onChange={handleSearchChange}
                    style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", outline: "none", color: "#1a1a2e" }}
                  />
                  <select
                    value={deptFilter}
                    onChange={handleDeptChange}
                    style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", outline: "none", color: "#1a1a2e", background: "white" }}
                  >
                    {allDepartments.map((d) => <option key={d}>{d}</option>)}
                  </select>
                  <input
                    placeholder="Min Salary"
                    type="number"
                    value={minSalary}
                    onChange={handleMinSalary}
                    style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", outline: "none", color: "#1a1a2e" }}
                  />
                  <input
                    placeholder="Max Salary"
                    type="number"
                    value={maxSalary}
                    onChange={handleMaxSalary}
                    style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", outline: "none", color: "#1a1a2e" }}
                  />
                </div>
              </div>

              {/* Table */}
              <div style={{ background: "white", borderRadius: "10px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f4f8" }}>
                  <span style={{ fontWeight: "600", color: "#1a1a2e", fontSize: "15px" }}>
                    All Employees ({filtered.length})
                  </span>
                </div>
                {paginated.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>No employees found!</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["Name", "Email", "Department", "Salary", "Actions"].map((h) => (
                          <th key={h} style={{ padding: "11px 16px", textAlign: "left", color: "#64748b", fontWeight: "500", fontSize: "13px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((emp, i) => (
                        <tr key={emp.id} style={{ borderTop: "1px solid #f0f4f8", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                          <td style={{ padding: "13px 16px", fontWeight: "500", color: "#1a1a2e" }}>{emp.name}</td>
                          <td style={{ padding: "13px 16px", color: "#64748b" }}>{emp.email}</td>
                          <td style={{ padding: "13px 16px" }}>
                            <span style={{ background: "#eff6ff", color: "#3b82f6", padding: "3px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "500" }}>{emp.department}</span>
                          </td>
                          <td style={{ padding: "13px 16px", color: "#1a1a2e", fontWeight: "500" }}>₹{emp.salary.toLocaleString()}</td>
                          <td style={{ padding: "13px 16px" }}>
                            <button onClick={() => handleEdit(emp)} style={{ background: "#fef3c7", color: "#d97706", border: "none", padding: "5px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "500", marginRight: "6px" }}>Edit</button>
                            <button onClick={() => handleDelete(emp.id)} style={{ background: "#fee2e2", color: "#ef4444", border: "none", padding: "5px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "500" }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ padding: "16px 20px", borderTop: "1px solid #f0f4f8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>
                      Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} employees
                    </span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", background: currentPage === 1 ? "#f8fafc" : "white", color: currentPage === 1 ? "#cbd5e1" : "#1a1a2e", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: "13px" }}
                      >← Prev</button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", background: currentPage === page ? "#4f8ef7" : "white", color: currentPage === page ? "white" : "#1a1a2e", cursor: "pointer", fontSize: "13px", fontWeight: currentPage === page ? "600" : "400" }}
                        >{page}</button>
                      ))}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", background: currentPage === totalPages ? "#f8fafc" : "white", color: currentPage === totalPages ? "#cbd5e1" : "#1a1a2e", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontSize: "13px" }}
                      >Next →</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ========== DASHBOARD TAB ========== */}
          {activeTab === "dashboard" && (
            <div style={{ display: "grid", gap: "20px" }}>
              <div style={{ background: "white", borderRadius: "10px", padding: "24px", border: "1px solid #e2e8f0" }}>
                <h2 style={{ margin: "0 0 20px", color: "#1a1a2e", fontSize: "16px", fontWeight: "600" }}>📊 Salary by Employee</h2>
                {employees.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#94a3b8" }}>No data yet — add employees first!</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(v) => `₹${v.toLocaleString()}`} />
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Salary"]} />
                      <Bar dataKey="salary" fill="#4f8ef7" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div style={{ background: "white", borderRadius: "10px", padding: "24px", border: "1px solid #e2e8f0" }}>
                <h2 style={{ margin: "0 0 20px", color: "#1a1a2e", fontSize: "16px", fontWeight: "600" }}>🥧 Employees by Department</h2>
                {pieData.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#94a3b8" }}>No data yet — add employees first!</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
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