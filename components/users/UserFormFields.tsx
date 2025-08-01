import React from 'react';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  const idPrefix = isEditMode ? 'edit-' : 'reg-';
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor={`${idPrefix}firstName`}>First Name</Label>
          <Input id={`${idPrefix}firstName`} name="firstName" value={formData.firstName} onChange={handleChange} required />
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor={`${idPrefix}lastName`}>Last Name</Label>
          <Input id={`${idPrefix}lastName`} name="lastName" value={formData.lastName} onChange={handleChange} required />
        </div>
      </div>
       <div className="grid w-full items-center gap-1.5">
        <Label htmlFor={`${idPrefix}username`}>Username</Label>
        <Input id={`${idPrefix}username`} name="username" value={formData.username} onChange={handleChange} required />
       </div>
       <div className="grid w-full items-center gap-1.5">
        <Label htmlFor={`${idPrefix}email`}>Email</Label>
        <Input id={`${idPrefix}email`} name="email" type="email" value={formData.email} onChange={handleChange} required />
       </div>
       <div className="grid w-full items-center gap-1.5">
        <Label htmlFor={`${idPrefix}gameName`}>Game Name (Nickname)</Label>
        <Input id={`${idPrefix}gameName`} name="gameName" value={formData.gameName} onChange={handleChange} required />
       </div>
       <div className="grid w-full items-center gap-1.5">
        <Label htmlFor={`${idPrefix}birthday`}>Birthday</Label>
        <Input id={`${idPrefix}birthday`} name="birthday" type="date" value={formData.birthday} onChange={handleChange} required />
       </div>
    </>
  );
};

export default UserFormFields;