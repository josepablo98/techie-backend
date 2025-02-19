const { Router } = require("express");
const { createChat, updateChat, getChatsByUserId, getChatsByUserIdAndChatId, fetchGeminiApi, updateTitle } = require('../controllers/chat');

const router = Router();


router.post("/fetch", fetchGeminiApi);
router.post("/create", createChat);
router.post("/getchat/:id", getChatsByUserIdAndChatId);
router.post("/getchats", getChatsByUserId);
router.put("/update/:id", updateChat);
router.put("/update-title/:id", updateTitle);

module.exports = router;