import api from './api';

export interface SiteSettingsData {
  id?: number;
  site_title: string;
  site_subtitle: string;
  welcome_message: string;
  theme: 'clair' | 'sombre' | 'auto';
  font_size: 'petite' | 'moyenne' | 'grande';
  primary_color: string;
  secondary_color: string;
  contact_email: string;
  contact_phone: string;
  meta_description: string;
  logo_url?: string;
  favicon_url?: string;
  created_at?: string;
  updated_at?: string;
}

export const settingsApi = {
  // Récupérer les paramètres du site
  getSiteSettings: async (): Promise<SiteSettingsData> => {
    try {
      const response = await api.get('/settings/');
      return response.data.results?.[0] || response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres du site:', error);
      throw error;
    }
  },

  // Mettre à jour les paramètres du site
  updateSiteSettings: async (settings: Partial<SiteSettingsData>): Promise<SiteSettingsData> => {
    try {
      const response = await api.put('/settings/1/', settings);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres du site:', error);
      throw error;
    }
  },

  // Récupérer tous les paramètres (incluant les autres catégories)
  getAllSettings: async () => {
    try {
      const response = await api.get('/settings/');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      throw error;
    }
  },

  // Mettre à jour tous les paramètres
  updateAllSettings: async (settings: any) => {
    try {
      const response = await api.put('/settings/', settings);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      throw error;
    }
  }
};
