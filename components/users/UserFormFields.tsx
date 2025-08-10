import React from 'react';
import Input from '../user-interface/Input';

interface UserFormFieldsProps {
  formData: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    gameName: string;
    birthday: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEditMode?: boolean;
}

const UserFormFields: React.FC<UserFormFieldsProps> = ({ formData, handleChange, isEditMode = false }) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="First Name" id={`${isEditMode ? 'edit-' : 'reg-'}firstName`} name="firstName" value={formData.firstName} onChange={handleChange} required />
        <Input label="Last Name" id={`${isEditMode ? 'edit-' : 'reg-'}lastName`} name="lastName" value={formData.lastName} onChange={handleChange} required />
      </div>
      <Input label="Username" id={`${isEditMode ? 'edit-' : 'reg-'}username`} name="username" value={formData.username} onChange={handleChange} required />
      <Input label="Email" id={`${isEditMode ? 'edit-' : 'reg-'}email`} name="email" type="email" value={formData.email} onChange={handleChange} required />
      <Input label="Game Name (Nickname)" id={`${isEditMode ? 'edit-' : 'reg-'}gameName`} name="gameName" value={formData.gameName} onChange={handleChange} required />
      <Input label="Birthday" id={`${isEditMode ? 'edit-' : 'reg-'}birthday`} name="birthday" type="date" value={formData.birthday} onChange={handleChange} required />
    </>
  );
};

export default UserFormFields;
