const db = require('../config/database');

exports.getRetail = async (req, res) => {
  const [rows] = await db.query(
    'SELECT retail_id, name, latitude, longitude, radius, is_active, is_deleted FROM retail'
  );
  res.json(rows);
};

exports.getUserCategories = async (req, res) => {
  const [rows] = await db.query(
    'SELECT id_category, role_id, category_user FROM user_category'
  );
  res.json(rows);
};

exports.getUsers = async (req, res) => {
  const [rows] = await db.query(
    'SELECT user_id, name, username, password, category_user, upline, enabled, photo_url FROM user WHERE is_deleted = 0'
  );
  res.json(rows);
};

exports.getShifts = async (req, res) => {
  const [shifts] = await db.query(
    `SELECT shifting_id, user_id, retail_id,
      DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
      DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
      is_deleted FROM shifting`
  );
  const [members] = await db.query(
    'SELECT shifting_id, user_id FROM shift_employes'
  );

  const memberMap = members.reduce((acc, m) => {
    if (!acc[m.shifting_id]) acc[m.shifting_id] = [];
    acc[m.shifting_id].push({ user_id: m.user_id });
    return acc;
  }, {});

  const result = shifts.map(s => ({
    ...s,
    employees: memberMap[s.shifting_id] || []
  }));

  res.json(result);
};
