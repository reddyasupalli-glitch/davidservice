import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(express.json());

// CORS: allow client + admin domains
app.use(cors({
  origin: "*"
}));

// ====== DB ======
await mongoose.connect(process.env.MONGO_URI);

const OrderSchema = new mongoose.Schema({
  invoiceNumber: String,
  service: String,
  package: String,
  discordUsername: String,
  email: String,
  notes: String,
  selectedOptions: [String],
  total: Number,
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model("Order", OrderSchema);

// ====== PUBLIC ENDPOINT (client submits orders) ======
app.post("/api/orders", async (req,res)=>{
  try{
    const order = new Order(req.body);
    await order.save();
    res.json({ ok:true });
  }catch(err){
    res.status(500).json({ ok:false });
  }
});

// ====== ADMIN AUTH ======
app.post("/api/admin/login", async (req,res)=>{
  const { password } = req.body;

  if(password !== process.env.ADMIN_PASSWORD){
    return res.status(401).json({ ok:false });
  }

  const token = jwt.sign({ role:"admin" }, process.env.JWT_SECRET, { expiresIn:"7d" });
  res.json({ token });
});

function auth(req,res,next){
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ","");

  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if(decoded.role !== "admin") throw new Error("bad");
    next();
  }catch(err){
    res.status(401).json({ ok:false });
  }
}

// ====== ADMIN ORDERS ======
app.get("/api/admin/orders", auth, async (req,res)=>{
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

app.get("/", (req,res)=>res.send("David Services API running ✅"));

app.listen(process.env.PORT || 3000, ()=>{
  console.log("Server running...");
});
