  import React, { useState, useEffect } from 'react';
  import { toast } from 'react-toastify';
  import ProfileHeader from './ProfileHeader';
  import ProfileImageSection from './ProfileImageSection';
  import PersonalInfoSection from './PersonalInfoSection';
  import AddressSection from './AddressSection';
  import SecurityInfoBanner from './SecurityInfoBanner';
  import SimpleLocationSelector from '../location/SimpleLocationSelector';


  const UserProfile = ({ user, onUpdateProfile, onUploadImage }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Paraguay'
      },
      dateOfBirth: '',
      profilePic: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const handleLocationSave = (locationData) => {
  console.log('📍 Ubicación guardada:', locationData);
  toast.success('Ubicación actualizada en tu perfil');
  // La ubicación ya está guardada en el backend
};

    // Cargar datos del usuario al montar
    useEffect(() => {
      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: {
            street: user.address?.street || '',
            city: user.address?.city || '',
            state: user.address?.state || '',
            zipCode: user.address?.zipCode || '',
            country: user.address?.country || 'Paraguay'
          },
          dateOfBirth: user.dateOfBirth || '',
          profilePic: user.profilePic || ''
        });
      }
    }, [user]);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      
      if (name.startsWith('address.')) {
        const addressField = name.split('.')[1];
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            [addressField]: value
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }

      // Limpiar error del campo específico
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    };

    const validateForm = () => {
      const newErrors = {};

      if (!formData.name.trim()) {
        newErrors.name = 'El nombre es requerido';
      }

      if (!formData.email.trim()) {
        newErrors.email = 'El email es requerido';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'El email no es válido';
      }

      if (formData.phone && !/^[+]?[\d\s\-()]+$/.test(formData.phone)) {
        newErrors.phone = 'El teléfono no es válido';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
      if (!validateForm()) {
        return;
      }

      setLoading(true);
      try {
        await onUpdateProfile(formData);
        setIsEditing(false);
      } catch (error) {
        console.error('Error al actualizar perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleCancel = () => {
      // Restaurar datos originales
      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: {
            street: user.address?.street || '',
            city: user.address?.city || '',
            state: user.address?.state || '',
            zipCode: user.address?.zipCode || '',
            country: user.address?.country || 'Paraguay'
          },
          dateOfBirth: user.dateOfBirth || '',
          profilePic: user.profilePic || ''
        });
      }
      setIsEditing(false);
      setErrors({});
    };

    const handleEdit = () => {
      setIsEditing(true);
    };

    const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const imageUrl = await onUploadImage(file);
          setFormData(prev => ({
            ...prev,
            profilePic: imageUrl
          }));
        } catch (error) {
          console.error('Error al subir imagen:', error);
        }
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          
          {/* Header del perfil */}
          <ProfileHeader
            isEditing={isEditing}
            loading={loading}
            onEdit={handleEdit}
            onSave={handleSave}
            onCancel={handleCancel}
          />

          {/* Contenido del perfil */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Imagen de perfil */}
            <div className="lg:col-span-1">
              <ProfileImageSection
                profilePic={formData.profilePic}
                name={formData.name}
                email={formData.email}
                isEditing={isEditing}
                onImageUpload={handleImageUpload}
              />
            </div>

            {/* Información personal */}
            <div className="lg:col-span-2">
              <PersonalInfoSection
                formData={formData}
                isEditing={isEditing}
                errors={errors}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Dirección */}
          <div className="mt-6">
            <AddressSection
              address={formData.address}
              isEditing={isEditing}
              onChange={handleInputChange}
            />
          </div>
                  <div className="mt-6">
          <SimpleLocationSelector
            title="Mi Ubicación Principal"
            isUserLoggedIn={true}
            onLocationSave={handleLocationSave}
          />
        </div>

          {/* Información de seguridad */}
          <div className="mt-6">
            <SecurityInfoBanner />
          </div>
        </div>
      </div>
    );
  };

  export default UserProfile;