// backend/scripts/assignBancardUserIds.js - SCRIPT DE MIGRACIÓN

const mongoose = require('mongoose');
const userModel = require('../models/userModel');
require('dotenv').config();

async function migrateBancardUserIds() {
    try {
        console.log('🔄 === INICIANDO MIGRACIÓN DE bancardUserId ===');
        console.log('📅 Fecha:', new Date().toISOString());
        
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');
        
        // Verificar usuarios existentes
        const totalUsers = await userModel.countDocuments();
        console.log(`📊 Total de usuarios en la base de datos: ${totalUsers}`);
        
        // Usuarios sin bancardUserId
        const usersWithoutBancardId = await userModel.countDocuments({ 
            $or: [
                { bancardUserId: { $exists: false } },
                { bancardUserId: null },
                { bancardUserId: undefined }
            ]
        });
        
        console.log(`❌ Usuarios sin bancardUserId: ${usersWithoutBancardId}`);
        
        if (usersWithoutBancardId === 0) {
            console.log('✅ Todos los usuarios ya tienen bancardUserId asignado');
            process.exit(0);
        }
        
        // Ejecutar la migración
        console.log('🚀 Iniciando proceso de asignación...');
        const result = await userModel.assignBancardUserIds();
        
        if (result) {
            console.log('✅ Migración completada exitosamente');
            
            // Verificar resultados
            const usersWithBancardId = await userModel.countDocuments({ 
                bancardUserId: { $exists: true, $ne: null }
            });
            
            console.log(`📊 Usuarios con bancardUserId después de la migración: ${usersWithBancardId}`);
            
            // Mostrar algunos ejemplos
            const sampleUsers = await userModel.find({ 
                bancardUserId: { $exists: true } 
            }).limit(3).select('email bancardUserId name');
            
            console.log('📋 Ejemplos de usuarios migrados:');
            sampleUsers.forEach(user => {
                console.log(`  - ${user.email}: bancardUserId = ${user.bancardUserId}`);
            });
            
        } else {
            console.log('❌ Error en la migración');
        }
        
    } catch (error) {
        console.error('❌ Error ejecutando migración:', error);
    } finally {
        // Cerrar conexión
        await mongoose.connection.close();
        console.log('🔌 Conexión a MongoDB cerrada');
        process.exit(0);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    migrateBancardUserIds();
}

module.exports = migrateBancardUserIds;