// backend/middleware/fileUpload.js - MIDDLEWARE PARA SUBIDA DE ARCHIVOS
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * ✅ CREAR DIRECTORIO SI NO EXISTE
 */
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Directorio creado: ${dirPath}`);
    }
};

/**
 * ✅ CONFIGURACIÓN DE ALMACENAMIENTO PARA COMPROBANTES DE TRANSFERENCIA
 */
const bankTransferStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/bank_transfers/';
        ensureDirectoryExists(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const transferId = req.params.transferId || 'unknown';
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        const filename = `transfer-${transferId}-${timestamp}-${random}${extension}`;
        cb(null, filename);
    }
});

/**
 * ✅ CONFIGURACIÓN DE ALMACENAMIENTO PARA DOCUMENTOS GENERALES
 */
const generalStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/documents/';
        ensureDirectoryExists(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        const filename = `doc-${timestamp}-${random}${extension}`;
        cb(null, filename);
    }
});

/**
 * ✅ CONFIGURACIÓN DE ALMACENAMIENTO PARA PERFILES DE USUARIO
 */
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/profiles/';
        ensureDirectoryExists(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const userId = req.userId || 'unknown';
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        const filename = `profile-${userId}-${timestamp}${extension}`;
        cb(null, filename);
    }
});

/**
 * ✅ FILTRO DE ARCHIVOS PARA COMPROBANTES DE TRANSFERENCIA
 */
const bankTransferFileFilter = (req, file, cb) => {
    console.log('📎 Validando archivo de transferencia:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
    });

    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'application/pdf'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, GIF) y PDF'), false);
    }
};

/**
 * ✅ FILTRO DE ARCHIVOS PARA IMÁGENES DE PERFIL
 */
const profileImageFilter = (req, file, cb) => {
    console.log('🖼️ Validando imagen de perfil:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
    });

    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, GIF)'), false);
    }
};

/**
 * ✅ CONFIGURACIÓN PARA COMPROBANTES DE TRANSFERENCIA
 */
const uploadBankTransferProof = multer({
    storage: bankTransferStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
        files: 1 // Solo un archivo por vez
    },
    fileFilter: bankTransferFileFilter
});

/**
 * ✅ CONFIGURACIÓN PARA IMÁGENES DE PERFIL
 */
const uploadProfileImage = multer({
    storage: profileStorage,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB máximo
        files: 1
    },
    fileFilter: profileImageFilter
});

/**
 * ✅ CONFIGURACIÓN PARA DOCUMENTOS GENERALES
 */
const uploadDocument = multer({
    storage: generalStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
        files: 5 // Hasta 5 archivos
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'), false);
        }
    }
});

/**
 * ✅ MIDDLEWARE DE MANEJO DE ERRORES DE MULTER
 */
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('❌ Error de Multer:', err);
        
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    error: true,
                    message: 'El archivo es demasiado grande',
                    details: 'El tamaño máximo permitido es 5MB para comprobantes y 2MB para imágenes de perfil'
                });
            
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    error: true,
                    message: 'Demasiados archivos',
                    details: 'Solo se permite subir un archivo por vez'
                });
            
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    error: true,
                    message: 'Campo de archivo inesperado',
                    details: 'El nombre del campo de archivo no es válido'
                });
            
            default:
                return res.status(400).json({
                    success: false,
                    error: true,
                    message: 'Error al subir archivo',
                    details: err.message
                });
        }
    }
    
    if (err) {
        console.error('❌ Error general de archivo:', err);
        return res.status(400).json({
            success: false,
            error: true,
            message: err.message || 'Error al procesar archivo'
        });
    }
    
    next();
};

/**
 * ✅ MIDDLEWARE PARA VALIDAR QUE SE SUBIÓ UN ARCHIVO
 */
const requireFile = (fieldName = 'file') => {
    return (req, res, next) => {
        if (!req.file && !req.files) {
            return res.status(400).json({
                success: false,
                error: true,
                message: 'Se requiere subir un archivo',
                details: `Debe incluir un archivo en el campo '${fieldName}'`
            });
        }
        next();
    };
};

/**
 * ✅ MIDDLEWARE PARA LIMPIAR ARCHIVOS EN CASO DE ERROR
 */
const cleanupOnError = (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    const cleanup = () => {
        if (res.statusCode >= 400) {
            // Limpiar archivo subido si hay error
            if (req.file && req.file.path) {
                fs.unlink(req.file.path, (err) => {
                    if (err) {
                        console.error('❌ Error eliminando archivo temporal:', err);
                    } else {
                        console.log('🗑️ Archivo temporal eliminado:', req.file.path);
                    }
                });
            }
            
            // Limpiar múltiples archivos si hay error
            if (req.files && Array.isArray(req.files)) {
                req.files.forEach(file => {
                    if (file.path) {
                        fs.unlink(file.path, (err) => {
                            if (err) {
                                console.error('❌ Error eliminando archivo temporal:', err);
                            } else {
                                console.log('🗑️ Archivo temporal eliminado:', file.path);
                            }
                        });
                    }
                });
            }
        }
    };
    
    res.send = function(...args) {
        cleanup();
        originalSend.apply(this, args);
    };
    
    res.json = function(...args) {
        cleanup();
        originalJson.apply(this, args);
    };
    
    next();
};

/**
 * ✅ UTILIDAD PARA OBTENER URL PÚBLICA DEL ARCHIVO
 */
const getFileUrl = (filePath, req) => {
    if (!filePath) return null;
    
    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    return `${baseUrl}/${filePath.replace(/\\/g, '/')}`;
};

/**
 * ✅ UTILIDAD PARA ELIMINAR ARCHIVO
 */
const deleteFile = (filePath) => {
    return new Promise((resolve, reject) => {
        if (!filePath) {
            resolve(true);
            return;
        }
        
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('❌ Error eliminando archivo:', err);
                reject(err);
            } else {
                console.log('✅ Archivo eliminado:', filePath);
                resolve(true);
            }
        });
    });
};

/**
 * ✅ MIDDLEWARE PARA LOGGING DE ARCHIVOS SUBIDOS
 */
const logFileUpload = (req, res, next) => {
    if (req.file) {
        console.log('📎 Archivo subido:', {
            originalname: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype,
            uploadedBy: req.userId || 'guest',
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
        });
    }
    
    if (req.files && Array.isArray(req.files)) {
        console.log(`📎 ${req.files.length} archivos subidos:`, req.files.map(file => ({
            originalname: file.originalname,
            filename: file.filename,
            size: file.size
        })));
    }
    
    next();
};

module.exports = {
    // Configuraciones principales
    uploadBankTransferProof,
    uploadProfileImage,
    uploadDocument,
    
    // Middlewares de manejo
    handleMulterError,
    requireFile,
    cleanupOnError,
    logFileUpload,
    
    // Utilidades
    getFileUrl,
    deleteFile,
    ensureDirectoryExists
};