import React, { useState, useEffect } from "react";
import { getBuildings, getFloors } from "../../services/authService";
import "../../forms/styles/forms.css";

const STATUS_OPTIONS = [
  { value: "UC", label: "Construction" },
  { value: "C", label: "Commissioning" },
  { value: "HO", label: "Hand Over" },
];

function ZoneForm({ onClose, initialData, isEdit, onSubmit }) {
  const [building, setBuilding] = useState(""); // building_id
  const [level, setLevel] = useState(""); // floor_id
  const [levelName, setLevelName] = useState(""); // level string
  const [zone, setZone] = useState("");
  const [status, setStatus] = useState("UC");

  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [filteredFloorsList, setFilteredFloorsList] = useState([]);

  // Fetch buildings and floors
  useEffect(() => {
    const fetchBuildingsAndFloors = async () => {
      try {
        const [buildingsRes, floorsRes] = await Promise.all([
          getBuildings(1, 1000),
          getFloors(1, 1000)
        ]);
        const bRows = buildingsRes?.data?.rows ?? (Array.isArray(buildingsRes?.data) ? buildingsRes.data : (Array.isArray(buildingsRes) ? buildingsRes : []));
        const fRows = floorsRes?.data?.rows ?? (Array.isArray(floorsRes?.data) ? floorsRes.data : (Array.isArray(floorsRes) ? floorsRes : []));
        setBuildingsList(bRows);
        setFloorsList(fRows);
      } catch (err) {
        console.error("Failed to fetch buildings or floors", err);
      }
    };
    fetchBuildingsAndFloors();
  }, []);

  useEffect(() => {
    if (isEdit && initialData) {
      setBuilding(initialData.building_id || initialData.build_id || "");
      const fId = initialData.floor_id || initialData.fl_id || "";
      if (fId) {
        setLevel(fId);
      } else if (initialData.level && Array.isArray(floorsList) && floorsList.length > 0) {
        const found = floorsList.find(f => (f.floor_name || f.name) === initialData.level);
        if (found) {
          setLevel(found.fl_id ?? found.id ?? found.floor_id ?? "");
        }
      }
      setLevelName(initialData.level || "");
      setZone(initialData.zone || initialData.zone_name || "");
      setStatus(initialData.status || "UC");
    }
  }, [initialData, isEdit, floorsList]);

  // Filter levels based on selected building
  useEffect(() => {
    if (building && Array.isArray(floorsList) && floorsList.length > 0) {
      const filtered = floorsList.filter(f => String(f.build_id ?? f.building_id) === String(building));
      setFilteredFloorsList(filtered);
    } else {
      setFilteredFloorsList([]);
    }
  }, [building, floorsList]);

  const handleBuildingChange = (e) => {
    const bId = e.target.value;
    setBuilding(bId);
    setLevel(""); // Reset floor when building changes
    setLevelName("");
  };

  const handleLevelChange = (e) => {
    const fId = e.target.value;
    setLevel(fId);
    const allFloors = [...filteredFloorsList, ...(Array.isArray(floorsList) ? floorsList : [])];
    const matched = allFloors.find(f => String(f.fl_id ?? f.id ?? f.floor_id) === String(fId));
    setLevelName(matched ? (matched.floor_name || matched.name || matched.level || "") : "");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!building || !level || !zone.trim()) return;

    let finalLevelName = levelName;
    if (!finalLevelName) {
      const allFloors = [...filteredFloorsList, ...(Array.isArray(floorsList) ? floorsList : [])];
      const matched = allFloors.find(f => String(f.fl_id ?? f.id ?? f.floor_id) === String(level));
      finalLevelName = matched ? (matched.floor_name || matched.name || matched.level || "") : "";
    }

    const payload = {
      building_id: Number(building),
      floor_id: Number(level),
      level: finalLevelName,
      zone: zone.trim(),
      status: status || "UC",
    };

    onSubmit && onSubmit(payload);
  };

  return (
    <form className="df-form" onSubmit={handleSubmit} noValidate>
      <div className="df-grid">

        {/* Building Select */}
        <div className="df-field df-field--full">
          <label className="df-label">
            Building <span className="df-required">*</span>
          </label>
          <select
            className="df-select"
            value={building}
            onChange={handleBuildingChange}
            required
            disabled={isEdit}
          >
            <option value="">Select Building</option>
            {buildingsList.map((b) => {
              const bId = b.build_id ?? b.id ?? b.building_id;
              const bName = b.building_name ?? b.name;
              return (
                <option key={bId} value={bId}>{bName}</option>
              );
            })}
          </select>
        </div>

        {/* Level / Floor */}
        <div className="df-field df-field--full">
          <label className="df-label">
            Level / Floor <span className="df-required">*</span>
          </label>
          <select
            className="df-select"
            value={level}
            onChange={handleLevelChange}
            required
            disabled={isEdit || !building}
          >
            <option value="">Select Level</option>
            {filteredFloorsList.map((l) => {
              const fId = l.fl_id ?? l.id ?? l.floor_id;
              const fName = l.floor_name ?? l.name ?? l.level;
              return (
                <option key={fId} value={fId}>{fName}</option>
              );
            })}
          </select>
        </div>

        {/* Zone Name */}
        <div className="df-field df-field--full">
          <label className="df-label">
            Zone Name <span className="df-required">*</span>
          </label>
          <input
            type="text"
            className="df-input"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            placeholder="e.g. Restricted Lab B"
            required
            disabled={isEdit}
          />
        </div>

        {/* Status */}
        <div className="df-field df-field--full">
          <label className="df-label">
            Status <span className="df-required">*</span>
          </label>
          <select
            className="df-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Footer */}
      <div className="df-footer">
        <button type="button" className="df-btn df-btn--cancel" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="df-btn df-btn--submit" disabled={!building || (!level && !isEdit) || !zone.trim()}>
          {isEdit ? "Update Zone" : "Add Zone"}
        </button>
      </div>
    </form>
  );
}

export default ZoneForm;
