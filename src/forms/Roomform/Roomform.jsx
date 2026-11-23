import React, { useState, useEffect } from "react";
import { getBuildings, getFloors, getZones } from "../../services/authService";
import "../../forms/styles/forms.css";

function RoomForm({ onClose, initialData, isEdit, onSubmit }) {
  const [building, setBuilding] = useState(""); // building_id
  const [floor, setFloor] = useState(""); // fl_id
  const [zone, setZone] = useState(""); // zone_id
  const [roomName, setRoomName] = useState("");

  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [zonesList, setZonesList] = useState([]);
  const [filteredFloorsList, setFilteredFloorsList] = useState([]);
  const [filteredZonesList, setFilteredZonesList] = useState([]);

  // Fetch buildings, floors, and zones
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [buildingsRes, floorsRes, zonesRes] = await Promise.all([
          getBuildings(1, 1000),
          getFloors(1, 1000),
          getZones(1, 1000)
        ]);
        const bRows = buildingsRes?.data?.rows ?? (Array.isArray(buildingsRes?.data) ? buildingsRes.data : (Array.isArray(buildingsRes) ? buildingsRes : []));
        const fRows = floorsRes?.data?.rows ?? (Array.isArray(floorsRes?.data) ? floorsRes.data : (Array.isArray(floorsRes) ? floorsRes : []));
        const zRows = zonesRes?.data?.rows ?? (Array.isArray(zonesRes?.data) ? zonesRes.data : (Array.isArray(zonesRes) ? zonesRes : []));
        setBuildingsList(bRows);
        setFloorsList(fRows);
        setZonesList(zRows);
      } catch (err) {
        console.error("Failed to fetch location data", err);
      }
    };
    fetchAllData();
  }, []);

  useEffect(() => {
    if (isEdit && initialData) {
      setRoomName(initialData.room_name || initialData.name || "");
      setFloor(initialData.fl_id || initialData.floor_id || "");
      setZone(initialData.zone_id || initialData.id || "");
      setBuilding(initialData.building_id || initialData.build_id || "");

      // Fallback: Resolve building id from floor if building_id is missing
      if ((!initialData.building_id && !initialData.build_id) && (initialData.fl_id || initialData.floor_id) && Array.isArray(floorsList) && floorsList.length > 0) {
        const matched = floorsList.find(f => String(f.fl_id ?? f.id) === String(initialData.fl_id || initialData.floor_id));
        if (matched) {
          setBuilding(matched.build_id ?? matched.building_id ?? "");
        }
      }
    }
  }, [initialData, isEdit, floorsList]);

  // Filter floors based on selected building
  useEffect(() => {
    if (building && Array.isArray(floorsList) && floorsList.length > 0) {
      const filtered = floorsList.filter(f => String(f.build_id ?? f.building_id) === String(building));
      setFilteredFloorsList(filtered);
    } else {
      setFilteredFloorsList([]);
    }
  }, [building, floorsList]);

  // Filter zones based on selected floor
  useEffect(() => {
    if (floor && Array.isArray(zonesList) && zonesList.length > 0) {
      const filtered = zonesList.filter(z => {
        if (z.floor_id && String(z.floor_id) === String(floor)) return true;
        if (z.fl_id && String(z.fl_id) === String(floor)) return true;
        const selectedFloorObj = floorsList.find(f => String(f.fl_id ?? f.id) === String(floor));
        if (selectedFloorObj && z.level && z.level.trim().toLowerCase() === (selectedFloorObj.floor_name || "").trim().toLowerCase()) {
          return true;
        }
        return false;
      });
      setFilteredZonesList(filtered);
    } else {
      setFilteredZonesList([]);
    }
  }, [floor, zonesList, floorsList]);

  const handleBuildingChange = (e) => {
    const bId = e.target.value;
    setBuilding(bId);
    setFloor("");
    setZone("");
  };

  const handleFloorChange = (e) => {
    const fId = e.target.value;
    setFloor(fId);
    setZone("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!building || !floor || !zone || !roomName.trim()) return;

    const payload = {
      building_id: Number(building),
      fl_id: Number(floor),
      zone_id: Number(zone),
      room_name: roomName.trim()
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

        {/* Floor Select */}
        <div className="df-field df-field--full">
          <label className="df-label">
            Floor / Level <span className="df-required">*</span>
          </label>
          <select
            className="df-select"
            value={floor}
            onChange={handleFloorChange}
            required
            disabled={isEdit || !building}
          >
            <option value="">Select Floor</option>
            {filteredFloorsList.map((l) => {
              const fId = l.fl_id ?? l.id ?? l.floor_id;
              const fName = l.floor_name ?? l.name ?? l.level;
              return (
                <option key={fId} value={fId}>{fName}</option>
              );
            })}
          </select>
        </div>

        {/* Zone Select */}
        <div className="df-field df-field--full">
          <label className="df-label">
            Zone <span className="df-required">*</span>
          </label>
          <select
            className="df-select"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            required
            disabled={isEdit || !floor}
          >
            <option value="">Select Zone</option>
            {filteredZonesList.map((z) => {
              const zId = z.id ?? z.zoneStatusId ?? z.zone_id;
              const zName = z.zone ?? z.zone_name;
              return (
                <option key={zId} value={zId}>{zName}</option>
              );
            })}
          </select>
        </div>

        {/* Room Name */}
        <div className="df-field df-field--full">
          <label className="df-label">
            Room Name <span className="df-required">*</span>
          </label>
          <input
            type="text"
            className="df-input"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="e.g. Conference Room 101"
            required
          />
        </div>

      </div>

      {/* Footer */}
      <div className="df-footer">
        <button type="button" className="df-btn df-btn--cancel" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="df-btn df-btn--submit" disabled={!building || !floor || !zone || !roomName.trim()}>
          {isEdit ? "Update Room" : "Add Room"}
        </button>
      </div>
    </form>
  );
}

export default RoomForm;
