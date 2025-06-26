// frontend/src/pages/UserProfilePage.js
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import UserProfile from '../components/user/UserProfile';
import CardManagementPage from '../components/user/CardManagementPage';
import FavoritesPage from '../components/user/FavoritesPage';
import SettingsPage from '../components/user/SettingsPage';
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
  const user = useSelector(state => state?.user?.user);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar autenticación
  useEffect(() => {
    if (!user) {
      navigate('/iniciar-sesion');
      return;
    }
    fetchUserProfile();
  }, [user, navigate]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(SummaryApi.current_user.url, {
        method: SummaryApi.current_user.method,
        credentials: 'include'
      });

      const result = await response.json();
      if (result.success) {
        setUserData(result.data);
      } else {
        toast.error('Error al cargar perfil');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // ✅ IMPLEMENTAR GESTIÓN DE TARJETAS BANCARD
  const handleRegisterCard = async (cardData) => {
    try {
      console.log('🆔 Registrando tarjeta:', cardData);
      
      const response = await fetch(`${SummaryApi.baseURL}/api/bancard/tarjetas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(cardData)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('✅ Proceso de catastro iniciado');
        return result;
      } else {
        toast.error(result.message || 'Error al iniciar catastro');
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('❌ Error en catastro:', error);
      toast.error('Error de conexión');
      return { success: false, message: 'Error de conexión' };
    }
  };

  const handleFetchCards = async (userId) => {
    try {
      console.log('📋 Obteniendo tarjetas para usuario:', userId);
      
      const response = await fetch(`${SummaryApi.baseURL}/api/bancard/tarjetas/${userId}`, {
        method: 'GET',
        credentials: 'include'
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Tarjetas obtenidas:', result.data);
        return result.data.cards || [];
      } else {
        console.warn('⚠️ Error obteniendo tarjetas:', result.message);
        return [];
      }
    } catch (error) {
      console.error('❌ Error obteniendo tarjetas:', error);
      throw error;
    }
  };

  const handleDeleteCard = async (userId, aliasToken) => {
    try {
      console.log('🗑️ Eliminando tarjeta:', { userId, aliasToken });
      
      const response = await fetch(`${SummaryApi.baseURL}/api/bancard/tarjetas/${userId}`, {
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
        toast.error(result.message || 'Error al eliminar tarjeta');
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('❌ Error eliminando tarjeta:', error);
      toast.error('Error de conexión');
      return { success: false, message: 'Error de conexión' };
    }
  };

  // ✅ IMPLEMENTAR PAGO CON ALIAS TOKEN
  const handlePayWithToken = async (paymentData) => {
    try {
      console.log('💳 Pagando con token:', paymentData);
      
      const response = await fetch(`${SummaryApi.baseURL}/api/bancard/pago-con-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();
      
      if (result.success) {
        // Verificar si necesita 3DS
        if (result.data?.operation?.process_id) {
          toast.info('🔐 Verificación 3DS requerida');
          return { ...result, requires3DS: true };
        } else {
          toast.success('✅ Pago procesado exitosamente');
          return result;
        }
      } else {
        toast.error(result.message || 'Error en el pago');
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('❌ Error en pago con token:', error);
      toast.error('Error de conexión');
      return { success: false, message: 'Error de conexión' };
    }
  };

  const handleUpdateProfile = async (profileData) => {
    try {
      setLoading(true);
      
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
        setUserData(result.data);
        toast.success('✅ Perfil actualizado exitosamente');
      } else {
        toast.error(result.message || 'Error al actualizar perfil');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
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
      // Simular guardado de configuración
      await new Promise(resolve => setTimeout(resolve, 1000));
      localStorage.setItem(`user_settings_${user.id}`, JSON.stringify(settings));
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
    { id: 'favorites', label: 'Favoritos', icon: FaHeart },
    { id: 'settings', label: 'Configuración', icon: FaCog }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-[#2A3190] mx-auto mb-4" />
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Error al cargar perfil del usuario</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 bg-[#2A3190] text-white px-4 py-2 rounded-lg"
          >
            Volver al inicio
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
                <p className="font-medium text-gray-800">{userData.name}</p>
                <p className="text-sm text-gray-500">{userData.email}</p>
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
                  onClick={() => setActiveTab(tab.id)}
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
            user={userData}
            onUpdateProfile={handleUpdateProfile}
            onUploadImage={handleUploadImage}
          />
        )}

        {activeTab === 'cards' && (
          <CardManagementPage
            user={{
              id: userData.bancardUserId || userData._id,
              name: userData.name,
              email: userData.email,
              phone: userData.phone
            }}
            onRegisterCard={handleRegisterCard}
            onDeleteCard={handleDeleteCard}
            onFetchCards={handleFetchCards}
            onPayWithToken={handlePayWithToken}
          />
        )}

        {activeTab === 'favorites' && (
          <FavoritesPage
            user={userData}
            onNavigate={navigate}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            user={userData}
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