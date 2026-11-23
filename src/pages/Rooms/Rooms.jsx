import React, { useState, useEffect, useCallback } from "react";
import { showSuccess, showError, showDeleteConfirm, showDeleteSuccess } from "../../components/common/Toast/Toast";
import Table from "../../components/common/Table/Table";
import Modal from "../../components/common/Modal/Modal";
import { FaEdit, FaTrash, FaSearch, FaTimes, FaFileCsv, FaArrowDown } from "react-icons/fa";
import * as XLSX from "xlsx";
import RoomForm from "../../forms/Roomform/Roomform";
import { addRoom, getRooms, updateRoom, deleteRoom, getBuildings, getFloors, getZones } from "../../services/authService";
import "../styles/pages.css";

const PAGE_LIMIT_DEFAULT = 10;

const Rooms = () => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomList, setRoomList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(PAGE_LIMIT_DEFAULT);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [zones, setZones] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [filterRoomName, setFilterRoomName] = useState("");
  const [appliedRoomName, setAppliedRoomName] = useState("");

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) {
        const parsed = JSON.parse(u);
        setUserRole(parsed.role || parsed.userType || "");
      } else {
        setUserRole(localStorage.getItem("UserType") || "");
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ─── Fetch building, floor, and zone maps ───────────────────────────────────
  useEffect(() => {
    const fetchMaps = async () => {
      try {
        const [buildingsRes, floorsRes, zonesRes] = await Promise.all([
          getBuildings(1, 1000),
          getFloors(1, 1000),
          getZones(1, 1000)
        ]);
        const bRows = buildingsRes?.data?.rows ?? (Array.isArray(buildingsRes?.data) ? buildingsRes.data : (Array.isArray(buildingsRes) ? buildingsRes : []));
        const fRows = floorsRes?.data?.rows ?? (Array.isArray(floorsRes?.data) ? floorsRes.data : (Array.isArray(floorsRes) ? floorsRes : []));
        const zRows = zonesRes?.data?.rows ?? (Array.isArray(zonesRes?.data) ? zonesRes.data : (Array.isArray(zonesRes) ? zonesRes : []));
        setBuildings(bRows);
        setFloors(fRows);
        setZones(zRows);
      } catch (err) {
        console.error("Failed to load map data", err);
      }
    };
    fetchMaps();
  }, []);

  const floorMap = {};
  floors.forEach((f) => {
    floorMap[f.fl_id ?? f.id] = f;
  });

  const buildingMap = {};
  buildings.forEach((b) => {
    buildingMap[b.build_id ?? b.id] = b.building_name ?? b.name;
  });

  const zoneMap = {};
  zones.forEach((z) => {
    zoneMap[z.id ?? z.zoneStatusId ?? z.zone_id] = z.zone ?? z.zone_name;
  });

  // ─── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.ceil((totalCount || roomList.length) / pageLimit);
  const startIndex = (currentPage - 1) * pageLimit;

  // ─── Fetch list ───────────────────────────────────────────────────────────
  const fetchRoomsList = useCallback(async (page = 1, searchKeyword = appliedRoomName) => {
    setIsLoading(true);
    try {
      const res = await getRooms(page, pageLimit, "", searchKeyword);
      const rawData = res?.data?.rows ?? res?.data ?? res ?? [];
      const rows = Array.isArray(rawData) ? rawData : (rawData?.rows ?? []);
      const count = res?.data?.count ?? res?.total ?? res?.count ?? rows.length;
      setRoomList(rows);
      setTotalCount(count);
    } catch (err) {
      showError("Failed to load rooms");
    } finally {
      setIsLoading(false);
    }
  }, [pageLimit, appliedRoomName]);

  useEffect(() => {
    fetchRoomsList(currentPage, appliedRoomName);
  }, [currentPage, appliedRoomName, fetchRoomsList]);

  const handleFilter = () => {
    setCurrentPage(1);
    setAppliedRoomName(filterRoomName);
  };

  const handleClear = () => {
    setFilterRoomName("");
    setAppliedRoomName("");
    setCurrentPage(1);
  };

  const handleExportCSV = async () => {
    try {
      const res = await getRooms(1, 100000, "", appliedRoomName);
      const rawData = res?.data?.rows ?? res?.data ?? res ?? [];
      const rows = Array.isArray(rawData) ? rawData : (rawData?.rows ?? []);
      if (rows.length === 0) {
        alert("No data available to export.");
        return;
      }
      const headers = ["S.No", "Building", "Floor / Level", "Zone Name", "Room Name"];
      const csvRows = rows.map((item, index) => {
        const flObj = floorMap[item.fl_id];
        const floorName = flObj ? flObj.floor_name : "—";
        const bName = item.building_id ? (buildingMap[item.building_id] || "—") : (flObj ? (buildingMap[flObj.build_id] || "—") : "—");
        const zName = zoneMap[item.zone_id] || "—";
        return [
          index + 1,
          `"${bName.replace(/"/g, '""')}"`,
          `"${floorName.replace(/"/g, '""')}"`,
          `"${zName.replace(/"/g, '""')}"`,
          `"${(item.room_name || "").replace(/"/g, '""')}"`
        ].join(",");
      });
      const csvContent = "\uFEFF" + [headers.join(","), ...csvRows].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `Rooms_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      showError("Export failed");
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await getRooms(1, 100000, "", appliedRoomName);
      const rawData = res?.data?.rows ?? res?.data ?? res ?? [];
      const rows = Array.isArray(rawData) ? rawData : (rawData?.rows ?? []);
      if (rows.length === 0) {
        alert("No data available to export.");
        return;
      }
      const headers = ["S.No", "Building", "Floor / Level", "Zone Name", "Room Name"];
      const wsData = [
        headers,
        ...rows.map((item, index) => {
          const flObj = floorMap[item.fl_id];
          const floorName = flObj ? flObj.floor_name : "—";
          const bName = item.building_id ? (buildingMap[item.building_id] || "—") : (flObj ? (buildingMap[flObj.build_id] || "—") : "—");
          const zName = zoneMap[item.zone_id] || "—";
          return [
            index + 1,
            bName,
            floorName,
            zName,
            item.room_name || ""
          ];
        })
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rooms");
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `Rooms_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      showError("Export failed");
    }
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleEdit = (item, index) => {
    setSelectedRoom({ ...item, serial: startIndex + index + 1 });
    setEditOpen(true);
  };

  const handleDelete = async (item) => {
    const result = await showDeleteConfirm();
    if (!result.isConfirmed) return;
    try {
      await deleteRoom(item.room_id ?? item.id);
      showDeleteSuccess();
      const newPage = roomList.length === 1 && currentPage > 1
        ? currentPage - 1
        : currentPage;
      setCurrentPage(newPage);
      fetchRoomsList(newPage, appliedRoomName);
    } catch (err) {
      showError("Failed to delete room");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const formatMsg = (m, fallback) => Array.isArray(m) ? m.join(", ") : (m || fallback);
      if (selectedRoom && editOpen) {
        const res = await updateRoom(selectedRoom.room_id ?? selectedRoom.id, formData);
        if (res && (res.statusCode >= 400 || res.status === "error" || res.status === 500)) {
          showError(formatMsg(res.message, "Failed to update room"));
          return;
        }
        showSuccess(formatMsg(res?.message, "Room updated successfully"));
        setEditOpen(false);
        setSelectedRoom(null);
      } else {
        const res = await addRoom(formData);
        if (res && (res.statusCode >= 400 || res.status === "error" || res.status === 500)) {
          showError(formatMsg(res.message, "Failed to create room"));
          return;
        }
        showSuccess(formatMsg(res?.message, "Room added successfully"));
        setOpen(false);
        setCurrentPage(1);
      }
      fetchRoomsList(1, appliedRoomName);
    } catch (err) {
      const respMsg = err?.response?.data?.message;
      const msg = Array.isArray(respMsg) ? respMsg.join(", ") : (respMsg || err?.message || "Operation failed");
      showError(msg);
    }
  };

  // ─── Table columns ────────────────────────────────────────────────────────
  const columns = [
    { header: "S.No", accessor: "serial" },
    { header: "Building", accessor: "buildingName" },
    { header: "Floor / Level", accessor: "floorName" },
    { header: "Zone Name", accessor: "zoneName" },
    { header: "Room Name", accessor: "room_name" },
    { header: "Actions", accessor: "actions" },
  ];

  const tableData = roomList.map((item, index) => {
    const flObj = floorMap[item.fl_id];
    const floorName = flObj ? flObj.floor_name : "—";
    const buildingName = item.building_id ? (buildingMap[item.building_id] || "—") : (flObj ? (buildingMap[flObj.build_id] || "—") : "—");
    const zoneName = zoneMap[item.zone_id] || "—";

    return {
      ...item,
      serial: startIndex + index + 1,
      floorName,
      buildingName,
      zoneName,
      actions: (
        <div className="dept-action-btns">
          <button
            className="dept-action-btn dept-action-btn--edit"
            title="Edit"
            onClick={() => handleEdit(item, index)}
          >
            <FaEdit />
          </button>
          <button
            className="dept-action-btn dept-action-btn--delete"
            title="Delete"
            onClick={() => handleDelete(item)}
          >
            <FaTrash />
          </button>
        </div>
      ),
    };
  });

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="dept-page">

      {/* ── Page Header ── */}
      <div className="dept-page-header">
        <div className="dept-page-header__left">
          <h1 className="dept-page-title">Rooms</h1>
          <p className="dept-page-subtitle">
            Manage and configure all room records
          </p>
        </div>
        <div className="dept-page-header__right">
          <span className="dept-count-badge">
            {totalCount || roomList.length} Total
          </span>
          <button
            className="dept-add-btn"
            onClick={() => { setSelectedRoom(null); setOpen(true); }}
          >
            <span className="dept-add-btn__icon">＋</span>
            Add Room
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="dept-table-card" style={{ marginBottom: "16px", padding: "16px 24px" }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem", fontWeight: "600", color: "#F9FAFB" }}>Filters</h3>
        <div className="df-form" style={{ padding: "0" }}>
          <div className="filters-grid">
            <div className="df-field" style={{ marginBottom: 0 }}>
              <label className="df-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>ROOM NAME</label>
              <input
                type="text"
                className="df-input"
                placeholder="Search by room name"
                value={filterRoomName}
                onChange={(e) => setFilterRoomName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFilter();
                }}
              />
            </div>
            <div className="filters-actions">
              <button
                onClick={handleFilter}
                type="button"
                className="dept-add-btn"
                style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)', color: '#fff', border: '1.5px solid #38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 4px 18px rgba(14,165,233,0.35)', transition: 'all 0.2s ease' }}
              >
                <FaSearch style={{ marginRight: '6px' }} /> Search
              </button>
              <button
                onClick={handleClear}
                type="button"
                className="dept-add-btn"
                style={{ background: 'rgba(14,165,233,0.07)', color: '#9ca3af', border: '1.5px solid rgba(14,165,233,0.22)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s ease' }}
              >
                <FaTimes style={{ marginRight: '6px' }} /> Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="dept-table-card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '12px' }}>
          <button onClick={handleExportCSV} className="dept-add-btn" style={{ backgroundColor: '#22C55E', border: 'none', cursor: 'pointer' }}>
            <FaFileCsv style={{ marginRight: '6px', fontSize: '1.1rem' }} /> CSV
          </button>
          <button onClick={handleExportExcel} className="dept-add-btn" style={{ backgroundColor: '#3B82F6', border: 'none', cursor: 'pointer' }}>
            <FaArrowDown style={{ marginRight: '6px' }} /> Excel
          </button>
        </div>
        <Table
          columns={columns}
          data={tableData}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      </div>

      {/* ── Add Modal ── */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Room"
        size="md"
        type="default"
      >
        <RoomForm
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); setSelectedRoom(null); }}
        title="Edit Room"
        size="md"
        type="warning"
      >
        <RoomForm
          isEdit
          initialData={selectedRoom}
          onClose={() => { setEditOpen(false); setSelectedRoom(null); }}
          onSubmit={handleSubmit}
        />
      </Modal>

    </div>
  );
};

export default Rooms;
