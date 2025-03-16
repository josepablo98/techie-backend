const { Router } = require("express");
const { getSettings, updateSettings } = require('../controllers/settings');

const router = Router();


router.post("/get-settings", getSettings);
router.put("/update-settings", updateSettings);

module.exports = router;