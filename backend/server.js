require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB connecté");
})
.catch((error) => {
    console.log(error);
});

const ReservationSchema = new mongoose.Schema({

    nom: String,
    telephone: String,
    personnes: String,
    date: String,
    heure: String,
    message: String

});

const Reservation = mongoose.model(
    "Reservation",
    ReservationSchema
);

app.post("/reservation", async (req, res) => {

    try {

        const reservation = new Reservation(req.body);

        await reservation.save();

        res.json({
            success: true,
            message: "Réservation enregistrée"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Erreur serveur"
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        "Serveur lancé sur le port " + PORT
    );

});