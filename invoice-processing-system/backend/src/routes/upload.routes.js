
const express = require('express')
const uplaod = require('../config/multer')

const router = express.Router();

const uploadController = (req , res) => {

    res.status(200).json({
        success : true,
        messsage: "File Received Successfully",
        file : req.file
    })

}

router.post('/' , upload.single("file") , uploadController)

module.exports = router;