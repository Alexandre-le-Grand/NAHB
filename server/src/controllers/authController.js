const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body
        const salt = await bcrypt.genSalt(10)

        const isRegisterd = await User.findOne({ where: { email } })

        if(isRegisterd){
            return res.status(400).json({ message: "Email deja utilisé" })
        }
        const hashedPassword = await bcrypt.hash(password, salt)
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword
        })
        res.status(201).json({ message: "Utilisateur créé avec succès !", userId: newUser.id })
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de l'inscription", error: error.message })
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ where: { email } })
        if (!user) return res.status(400).json({ message: "Email ou mot de passe incorrect" })
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) return res.status(400).json({ message: "Email ou mot de passe incorrect" })
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        )
        res.json({
            message: "Connexion réussie",
            token,
            user: { id: user.id, username: user.username, role: user.role }
        })
    } catch (error) {
res.status(500).json({ message: "Erreur serveur", error: error.message });    }
}
