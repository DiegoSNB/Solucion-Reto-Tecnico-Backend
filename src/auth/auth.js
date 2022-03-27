const jwt = require('jwt-simple');
var moment = require('moment');

const TOKEN_SECRET = process.env.TOKEN_SECRET || "Accendo";

const check = (req, res, next) => {
    if (!req.headers.authorization) {
        return res
            .status(403)
            .send({ message: "No puedes hacer esto... shu!!" });
    }
    const token = req.headers.authorization;
    const payload = jwt.decode(token, TOKEN_SECRET);
    req.user = payload.sub;

    next();
}


const createTokenUsuario = (user) => {  //Usuario
    var payload = {
        sub: user._id,
        iat: moment().unix(),
        exp: moment().add(180, "days").unix(),
    };
    return jwt.encode(payload, TOKEN_SECRET);
};

const createTokenChecador = (user) => {  //Checador
    var payload = {
        sub: user._id,
        iat: moment().unix(),
        exp: moment().add(180, "days").unix(),
    };
    return jwt.encode(payload, TOKEN_SECRET);
};

const createToken = (user) => {     //Administracion
    var payload = {
        sub: user._id,
        iat: moment().unix(),
        exp: moment().add(4, "hours").unix(),
    };
    return jwt.encode(payload, TOKEN_SECRET);
};

//
const validate = (req, res, next) => {
    if (!req.headers.authorization) {
        return res
            .status(403)
            .send({ message: "No puedes hacer esto... shu!!" });
    }else{
        try {
            const token = req.headers.authorization;
            const payload = jwt.decode(token, TOKEN_SECRET);
            req.user = payload.sub;

        } catch (error) {
            return res
            .status(401)
            .send({ message: "Incorrecto, Token invalido o expirado" });
        }
    }
    
    next();
}


module.exports = {
    check,
    createTokenUsuario,
    createTokenChecador,
    createToken,
    validate
}