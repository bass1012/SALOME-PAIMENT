import api from './api';

export interface QRCodeData {
  id: string;
  reference?: string;
  type: 'paiement' | 'client' | 'prestation' | 'promotion' | 'session' | 'identification' | 'recapitulatif';
  titre?: string;
  description?: string;
  contenu: string;
  montant?: number;
  client_id?: string;
  prestation_id?: string;
  date_creation: string;
  date_expiration?: string;
  statut: 'genere' | 'scanne' | 'expire' | 'utilise' | 'actif' | 'expiré' | 'utilisé';
  utilisations?: number;
  utilisations_max?: number;
  client_nom_complet?: string;
  type_qrcode_display?: string;
  statut_display?: string;
  est_expire?: boolean;
  est_valide?: boolean;
  nombre_scans?: number;
  image_qr?: string;
}

export interface QRCodeCreateData {
  client_id?: string;
  type_qrcode: 'identification' | 'prestation' | 'paiement' | 'recapitulatif';
  contenu: string;
  date_expiration?: string;
  titre?: string;
  description?: string;
  montant?: number;
  prestation_id?: string;
}

export const qrcodesApi = {
  // Récupérer tous les QR codes
  getQRCodes: async (params?: {
    search?: string;
    client?: string;
    type?: string;
    statut?: string;
    expire?: string;
  }): Promise<QRCodeData[]> => {
    try {
      const response = await api.get('/qr-codes/', { params });
      return response.data.results || response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des QR codes:', error);
      throw error;
    }
  },

  // Récupérer un QR code spécifique
  getQRCode: async (id: string): Promise<QRCodeData> => {
    try {
      const response = await api.get(`/qr-codes/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du QR code:', error);
      throw error;
    }
  },

  // Créer un nouveau QR code
  createQRCode: async (data: QRCodeCreateData): Promise<QRCodeData> => {
    try {
      const response = await api.post('/qr-codes/', data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du QR code:', error);
      throw error;
    }
  },

  // Mettre à jour un QR code
  updateQRCode: async (id: string, data: Partial<QRCodeCreateData>): Promise<QRCodeData> => {
    try {
      const response = await api.put(`/qr-codes/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du QR code:', error);
      throw error;
    }
  },

  // Supprimer un QR code
  deleteQRCode: async (id: string): Promise<void> => {
    try {
      await api.delete(`/qr-codes/${id}/`);
    } catch (error) {
      console.error('Erreur lors de la suppression du QR code:', error);
      throw error;
    }
  },

  // Générer un QR code pour un client spécifique
  generateForClient: async (data: {
    client_id: string;
    type_qrcode: 'identification' | 'prestation' | 'paiement' | 'recapitulatif';
    contenu?: string;
    date_expiration?: string;
  }): Promise<QRCodeData> => {
    try {
      const response = await api.post('/qr-codes/generer_pour_client/', data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la génération du QR code pour le client:', error);
      throw error;
    }
  },

  // Enregistrer un scan de QR code
  scanQRCode: async (id: string): Promise<QRCodeData> => {
    try {
      const response = await api.post(`/qr-codes/${id}/scanner/`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du scan:', error);
      throw error;
    }
  },

  // Marquer un QR code comme utilisé
  useQRCode: async (id: string): Promise<QRCodeData> => {
    try {
      const response = await api.post(`/qr-codes/${id}/utiliser/`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du marquage du QR code comme utilisé:', error);
      throw error;
    }
  },

  // Régénérer l'image du QR code
  regenerateQRCodeImage: async (id: string): Promise<QRCodeData> => {
    try {
      const response = await api.post(`/qr-codes/${id}/regenerer_image/`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la régénération de l\'image du QR code:', error);
      throw error;
    }
  },

  // Nettoyer les QR codes expirés
  cleanupExpiredQRCodes: async (): Promise<{ cleaned: number }> => {
    try {
      const response = await api.post('/qr-codes/nettoyer_expires/');
      return response.data;
    } catch (error) {
      console.error('Erreur lors du nettoyage des QR codes expirés:', error);
      throw error;
    }
  }
};
