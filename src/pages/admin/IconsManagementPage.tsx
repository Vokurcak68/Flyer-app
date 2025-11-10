import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import iconsService from '../../services/iconsService';
import { Icon } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { AppFooter } from '../../components/layout/AppFooter';

export const IconsManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIcon, setEditingIcon] = useState<Icon | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    imageFile: null as File | null,
    isEnergyClass: false,
  });

  const { data: icons = [], isLoading } = useQuery({
    queryKey: ['icons'],
    queryFn: () => iconsService.getAllIcons(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; imageData: string; imageMimeType: string; isEnergyClass: boolean }) =>
      iconsService.createIcon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icons'] });
      setIsDialogOpen(false);
      resetForm();
      alert('Ikona byla úspěšně vytvořena');
    },
    onError: (error: any) => {
      alert('Chyba při vytváření ikony: ' + (error.message || 'Neznámá chyba'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      iconsService.updateIcon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icons'] });
      setIsDialogOpen(false);
      resetForm();
      alert('Ikona byla úspěšně aktualizována');
    },
    onError: (error: any) => {
      alert('Chyba při aktualizaci ikony: ' + (error.message || 'Neznámá chyba'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => iconsService.deleteIcon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icons'] });
      alert('Ikona byla úspěšně smazána');
    },
    onError: (error: any) => {
      alert('Chyba při mazání ikony: ' + (error.message || 'Neznámá chyba'));
    },
  });

  const resetForm = () => {
    setFormData({ name: '', imageFile: null, isEnergyClass: false });
    setEditingIcon(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, imageFile: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      alert('Prosím zadejte název ikony');
      return;
    }

    if (editingIcon) {
      // Update
      const data: any = {
        name: formData.name,
        isEnergyClass: formData.isEnergyClass,
      };

      if (formData.imageFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          data.imageData = base64.split(',')[1];
          data.imageMimeType = formData.imageFile!.type;
          updateMutation.mutate({ id: editingIcon.id, data });
        };
        reader.readAsDataURL(formData.imageFile);
      } else {
        updateMutation.mutate({ id: editingIcon.id, data });
      }
    } else {
      // Create
      if (!formData.imageFile) {
        alert('Prosím vyberte obrázek');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        createMutation.mutate({
          name: formData.name,
          imageData: base64.split(',')[1],
          imageMimeType: formData.imageFile!.type,
          isEnergyClass: formData.isEnergyClass,
        });
      };
      reader.readAsDataURL(formData.imageFile);
    }
  };

  const handleEdit = (icon: Icon) => {
    setEditingIcon(icon);
    setFormData({
      name: icon.name,
      imageFile: null,
      isEnergyClass: icon.isEnergyClass || false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this icon?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 pb-16">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Icon Library</h1>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Icon
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {icons.map((icon) => (
          <div key={icon.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="aspect-square mb-2 flex items-center justify-center bg-gray-100 rounded">
              <img
                src={icon.imageUrl}
                alt={icon.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <p className="text-sm font-medium text-center mb-2 truncate" title={icon.name}>
              {icon.name}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => handleEdit(icon)}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="danger"
                className="flex-1"
                onClick={() => handleDelete(icon.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingIcon ? 'Upravit ikonu' : 'Nová ikona'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Název</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="např. Energetická třída A+++"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Obrázek {editingIcon && '(nechte prázdné pro zachování současného)'}
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              required={!editingIcon}
            />
          </div>
          {formData.imageFile && (
            <div className="border rounded p-2">
              <img
                src={URL.createObjectURL(formData.imageFile)}
                alt="Náhled"
                className="max-h-32 mx-auto"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isEnergyClass"
              checked={formData.isEnergyClass}
              onChange={(e) => setFormData({ ...formData, isEnergyClass: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isEnergyClass" className="text-sm font-medium">
              Energetická třída (zobrazí se 2× šířeji)
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {editingIcon ? 'Aktualizovat' : 'Vytvořit'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Zrušit
            </Button>
          </div>
        </form>
      </Modal>

      <AppFooter />
    </div>
  );
};
