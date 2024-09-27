const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();

router.get('/:id', async (req, res) => {
  const unionId = req.params.id;
  console.log(`Fetching union data for ID: ${unionId}`);

  try {
    const query = `
      SELECT id, union_name
      FROM "unions"
      WHERE id = $1;
    `;
    
    const result = await pool.query(query, [unionId]);
    
    if (result.rows.length > 0) {
      console.log(`Union data found:`, result.rows[0]);
      res.json(result.rows[0]);
    } else {
      console.log(`No union found for ID: ${unionId}`);
      res.status(404).json({ message: 'Union not found' });
    }
  } catch (error) {
    console.error('Error fetching union data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;