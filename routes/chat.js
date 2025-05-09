const { Router } = require("express");
const { createChat, updateChat, getChatsByUserId,
    getChatsByUserIdAndChatId,
    updateTitle, deleteChat, 
    deleteAllChats} = require('../controllers/chat');

const router = Router();


router.post("/create", createChat);
router.post("/getchat/:id", getChatsByUserIdAndChatId);
router.post("/getchats", getChatsByUserId);
router.put("/update/:id", updateChat);
router.put("/update-title/:id", updateTitle);
router.delete("/delete/:id", deleteChat);
router.delete("/delete", deleteAllChats);

module.exports = router;