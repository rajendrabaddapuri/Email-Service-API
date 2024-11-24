const express = require("express");
const mongoose = require("mongoose");
const app = express();
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const Port = 8000;
app.listen(Port, () => {
  console.log(`Server has started`);
});

// connection to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/")
  .then(() => {
    console.log("Mongodb connection sucsusfull");
  })
  .catch((err) => {
    console.log(err, `An error has occured`);
  });

//test endpoint

// create a write stream for logs

var accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), {
  flags: "a",
});

// setup the logger
app.use(morgan("combined", { stream: accessLogStream }));

app.get("/test", (req, res) => {
  res.status(200).json({ status: "suceess" });
});

// create schema

const userSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: [true, "Firstname is required"] },
    last_name: { type: String },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Entered format is not correct"],
    },
    gender: { type: String },
    password: {
      type: String,
      required: [true, "password is required"],
      select: false,
    },
    confrom_password: {
      type: String,
      required: [true, "required"],
      validate: {
        // This only works for save into document
        validator: function (e) {
          return e === this.password; //
        },
      },
    },
  },
  { timestamps: true }
);
//encrypting password before saving into db
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 5);
  this.confrom_password = undefined;
  next();
});
// its instance method used to check both passwords
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPaddword
) {
  return await bcrypt.compare(candidatePassword, userPaddword);
};
const userModel = mongoose.model("UserModel", userSchema);

app.post("/register", async (req, res) => {
  const body = req.body;
  const requiredFields = [
    "first_name",
    "last_name",
    "email",
    "gender",
    "password",
    "confrom_password",
  ];

  const missingFields = requiredFields.filter(
    (fields) => !body || !body[fields]
  );

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }

  try {
    const result = await userModel.create({
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      password: body.password,
      confrom_password: body.confrom_password,
      gender: body.gender,
    });
    const token = jwt.sign({ id: result._id }, "secret", { expiresIn: "1d" });
    res
      .status(201)
      .json({ message: "User has been added to the database.", token });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      // Duplicate key error for the email field
      res.status(409).json({
        message: "Email already exists. Please use a different email.",
      });
    } else {
      // Handle other errors
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user.", error });
    }
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return req
      .status(409)
      .json({ status: `Incorrect ${email}  or ${password}` });
  }
  const user = await userModel.findOne({ email: email }).select("+password");
  // const correct = user.correctPassword(password, user.password);

  if (!user || !user.correctPassword(password, user.password)) {
    return req.status(409).json({ status: `Incorrect email or password` });
  }

  const token = jwt.sign({ id: user._id }, "secret", { expiresIn: "1d" });

  res.status(200).json({ staus: "login sucessfull", user, token });
});

////////////
const nodemailer = require("nodemailer");

async function sendMail(email, subject, text) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "rajendra123baddapuri@gmail.com",
        pass: "Your password",
      },
    });

    const mailOptions = {
      from: "rajendra123baddapuri@gmail.com",
      to: email,
      subject: subject,
      text: text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

app.post("/sendMail", async (req, res) => {
  try {
    const { email, subject, text } = req.body;

    // Validate input
    if (!email || !subject || !text) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await sendMail(email, subject, text);
    res.status(200).json({ status: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
