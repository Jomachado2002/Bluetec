// frontend/src/pages/UserProfilePage.js - VERSIÓN CORREGIDA (IGUAL QUE ADMIN PANEL)
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import UserProfile from '../components/user/UserProfile';
import CardManagementPage from '../components/user/CardManagementPage';
import FavoritesPage from '../components/user/FavoritesPage';
import SettingsPage from '../components/user/SettingsPage';
import UserPurchases from '../components/user/UserPurchases';
import { BiSolidPurchaseTag } from "react-icons/bi";

import SummaryApi from '../common';
import { 
  FaUser, 
  FaCreditCard, 
  FaHeart, 
  FaCog, 
  FaSignOutAlt,
  FaHome,
  FaSpinner
} from 'react-icons/fa';

const UserProfilePage = () => {
  const user = useSelector(state => state?.user?.user); // ✅ IGUAL QUE ADMIN PANEL
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('profile');

  // ✅ VERIFICACIÓN SIMPLE IGUAL QUE ADMIN PANEL
  useEffect(() => {
    if (!user) {
      toast.info('Debes iniciar sesión para acceder a tu perfil');
      navigate('/iniciar-sesion');
    }
  }, [user, navigate]);

  // ✅ LEER TAB DESDE URL PARAMS
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['profile', 'cards', 'favorites', 'settings', 'purchases'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // ✅ FUNCIONES DE MANEJO (SIN CAMBIOS)
  const handleRegisterCard = async (cardData) => {
    try {
      console.log('🆔 === INICIANDO REGISTRO DE TARJETA ===');
      console.log('📤 Datos enviados:', cardData);
      
      const response = await fetch(`${SummaryApi.baseURL}/api/bancard/tarjetas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(cardData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response no OK:', response.status, errorText);
        toast.error(`Error del servidor: ${response.status}`);
        return { success: false, message: `Error ${response.status}` };
      }
      
      const responseText = await response.text();
      let result;
      
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Error parseando JSON:', parseError);
        toast.error('Error: Respuesta inválida del servidor');
        return { success: false, message: 'Respuesta inválida del servidor' };
      }
      
      if (result.success) {
        console.log('✅ Catastro exitoso!');
        if (result.data?.process_id) {
          toast.success('✅ Proceso de catastro iniciado');
          return result;
        } else {
          console.error('❌ No se recibió process_id válido');
          toast.error('Error: No se recibió process_id');
          return { success: false, message: 'No se recibió process_id' };
        }
      } else {
        toast.error(result.message || 'Error al iniciar catastro');
        return { success: false, message: result.message };
      }
      
    } catch (error) {
      console.error('❌ Error crítico en handleRegisterCard:', error);
      toast.error('Error de conexión crítico');
      return { success: false, message: 'Error de conexión crítico' };
    }
  };

  const handleFetchCards = async (userId) => {
    try {
      console.log('📋 === OBTENIENDO TARJETAS ===');
      const targetUserId = userId || user?.bancardUserId || 'me';
      
      const response = await fetch(`${SummaryApi.baseURL}/api/bancard/tarjetas/${targetUserId}`, {
        method: 'GET',
        credentials: 'include'
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Tarjetas obtenidas:', result.data);
        return result.data.cards || [];
      } else {
        console.warn('⚠️ Error obteniendo tarjetas:', result.message);
        toast.warn(result.message || 'No se pudieron cargar las tarjetas');
        return [];
      }
    } catch (error) {
      console.error('❌ Error obteniendo tarjetas:', error);
      toast.error('Error al cargar tarjetas');
      throw error;
    }
  };

  const handleDeleteCard = async (userId, aliasToken) => {
    try {
      console.log('🗑️ === ELIMINANDO TARJETA ===');
      const targetUserId = userId || user?.bancardUserId || 'me';
      
      const response = await fetch(`${SummaryApi.baseURL}/api/bancard/tarjetas/${targetUserId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ alias_token: aliasToken })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('✅ Tarjeta eliminada exitosamente');
        return result;
      } else {
        console.error('❌ Error eliminando tarjeta:', result);
        toast.error(result.message || 'Error al eliminar tarjeta');
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('❌ Error eliminando tarjeta:', error);
      toast.error('Error de conexión');
      return { success: false, message: 'Error de conexión' };
    }
  };

  const handleUpdateProfile = async (profileData) => {
    try {
      const response = await fetch(`${SummaryApi.baseURL}/api/perfil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(profileData)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('✅ Perfil actualizado exitosamente');
      } else {
        toast.error(result.message || 'Error al actualizar perfil');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    }
  };

  const handleUploadImage = async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${SummaryApi.baseURL}/api/perfil/imagen`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('✅ Imagen subida exitosamente');
        return result.data.profilePic;
      } else {
        toast.error(result.message || 'Error al subir imagen');
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };

  const handleChangePassword = async (passwordData) => {
    try {
      const response = await fetch(`${SummaryApi.baseURL}/api/perfil/cambiar-contrasena`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(passwordData)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('✅ Contraseña cambiada exitosamente');
      } else {
        toast.error(result.message || 'Error al cambiar contraseña');
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };

  const handleUpdateSettings = async (settings) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      localStorage.setItem(`user_settings_${user._id}`, JSON.stringify(settings));
      toast.success('✅ Configuración guardada');
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(SummaryApi.logout_user.url, {
        method: SummaryApi.logout_user.method,
        credentials: 'include'
      });

      const result = await response.json();
      if (result.success) {
        toast.success('👋 Sesión cerrada');
        navigate('/');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Mi Perfil', icon: FaUser },
    { id: 'cards', label: 'Mis Tarjetas', icon: FaCreditCard },
    { id: 'purchases', label: 'Mis Compras', icon: BiSolidPurchaseTag },
    { id: 'favorites', label: 'Favoritos', icon: FaHeart },
    { id: 'settings', label: 'Configuración', icon: FaCog }
  ];

  // ✅ VERIFICACIÓN SIMPLE IGUAL QUE ADMIN PANEL
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Debes iniciar sesión para acceder a tu perfil</p>
          <button 
            onClick={() => navigate('/iniciar-sesion')}
            className="bg-[#2A3190] text-white px-4 py-2 rounded-lg"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      
      {/* Header de navegación */}
      <div className="bg-white shadow-md border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            
            {/* Logo/Título */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-600 hover:text-[#2A3190] transition-colors"
              >
                <FaHome className="text-lg" />
                <span className="font-medium">BlueTec</span>
              </button>
              <span className="text-gray-400">|</span>
              <h1 className="text-xl font-bold text-[#2A3190]">Mi Cuenta</h1>
            </div>

            {/* Usuario y logout */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="font-medium text-gray-800">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                {user.bancardUserId && (
                  <p className="text-xs text-blue-600">ID Bancard: {user.bancardUserId}</p>
                )}
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <FaSignOutAlt className="text-sm" />
                <span className="hidden md:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>

          {/* Tabs de navegación */}
          <div className="flex space-x-1 overflow-x-auto pb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    const newUrl = `/mi-perfil?tab=${tab.id}`;
                    window.history.pushState(null, '', newUrl);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-[#2A3190] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="text-sm" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-6">
        {activeTab === 'profile' && (
          <UserProfile
            user={user} // ✅ USAR USER DIRECTO DESDE REDUX (IGUAL QUE ADMIN PANEL)
            onUpdateProfile={handleUpdateProfile}
            onUploadImage={handleUploadImage}
          />
        )}

        {activeTab === 'cards' && (
          <CardManagementPage
            user={{
              id: user.bancardUserId || user._id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              _id: user._id,
              role: user.role
            }}
            onRegisterCard={handleRegisterCard}
            onDeleteCard={handleDeleteCard}
            onFetchCards={handleFetchCards}
          />
        )}

        {activeTab === 'purchases' && (
          <UserPurchases
            user={{
              _id: user._id,
              bancardUserId: user.bancardUserId,
              name: user.name,
              email: user.email,
              phone: user.phone,
              role: user.role
            }}
          />
        )}
        
        {activeTab === 'favorites' && (
          <FavoritesPage
            user={user} // ✅ USER DIRECTO
            onNavigate={navigate}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            user={user} // ✅ USER DIRECTO
            onChangePassword={handleChangePassword}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </div>

      {/* Footer informativo */}
      <div className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">🔒 Seguridad</h3>
              <p className="text-sm text-gray-600">
                Tus datos están protegidos con encriptación de nivel bancario
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">💳 Pagos Seguros</h3>
              <p className="text-sm text-gray-600">
                Procesos certificados por Bancard, la plataforma más confiable de Paraguay
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">📞 Soporte 24/7</h3>
              <p className="text-sm text-gray-600">
                Estamos aquí para ayudarte en cualquier momento
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;