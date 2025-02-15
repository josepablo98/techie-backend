const { Router } = require("express");
const { createChat, updateChat } = require('../controllers/chat');

const router = Router();

router.post("/create", createChat);
router.put("/update/:id", updateChat);

module.exports = router;