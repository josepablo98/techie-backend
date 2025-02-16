const { Router } = require("express");
const { createChat, updateChat, getChatsByUserId, getChatsByUserIdAndChatId, fetchGeminiApi } = require('../controllers/chat');

const router = Router();


router.post("/fetch", fetchGeminiApi);
router.post("/create", createChat);
router.post("/getchat/:id", getChatsByUserIdAndChatId);
router.post("/getchats", getChatsByUserId);
router.put("/update/:id", updateChat);

module.exports = router;