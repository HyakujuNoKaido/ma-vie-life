// --- BASE DE DONNÉES INITIALE (SEED) ---

export const INITIAL_EXERCICES = [
  // PECTORAUX
  { id: 'p1', name: "Développé Couché", equipment: "Barre", cat: "Pectoraux", img: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400" },
  { id: 'p2', name: "Développé Incliné Haltères", equipment: "Haltères", cat: "Pectoraux", img: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400" },
  { id: 'p3', name: "Pompes", equipment: "Poids du corps", cat: "Pectoraux", img: "https://images.unsplash.com/photo-1598971639058-aba7c12af93a?w=400" },
  { id: 'p4', name: "Dips", equipment: "Barres", cat: "Pectoraux", img: "https://images.unsplash.com/photo-1591258339716-583cf2279373?w=400" },
  
  // DOS
  { id: 'd1', name: "Tractions", equipment: "Barre fixe", cat: "Dos", img: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400" },
  { id: 'd2', name: "Tirage Vertical", equipment: "Machine", cat: "Dos", img: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400" },
  { id: 'd3', name: "Rowing Barre", equipment: "Barre", cat: "Dos", img: "https://images.unsplash.com/photo-1567598508481-65985588e295?w=400" },
  { id: 'd4', name: "Soulevé de Terre", equipment: "Barre", cat: "Dos", img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400" },

  // JAMBES
  { id: 'j1', name: "Squat Arrière", equipment: "Barre", cat: "Jambes", img: "https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=400" },
  { id: 'j2', name: "Presse à Cuisses", equipment: "Machine", cat: "Jambes", img: "https://images.unsplash.com/photo-1541534741688-6078c6bd35e5?w=400" },
  { id: 'j3', name: "Fentes", equipment: "Haltères", cat: "Jambes", img: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400" },
  { id: 'j4', name: "Leg Extension", equipment: "Machine", cat: "Jambes", img: "https://images.unsplash.com/photo-1434596922112-19c563067271?w=400" },

  // ÉPAULES & BRAS
  { id: 'e1', name: "Développé Militaire", equipment: "Barre", cat: "Épaules", img: "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400" },
  { id: 'e2', name: "Élévations Latérales", equipment: "Haltères", cat: "Épaules", img: "https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?w=400" },
  { id: 'b1', name: "Curl Biceps", equipment: "Barre", cat: "Bras", img: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400" },
  
  // ABDOS
  { id: 'a1', name: "Planche", equipment: "Tapis", cat: "Abdos", img: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400" }
];

export const INITIAL_FOODS = [
  { id: 'f1', name: "Poulet (Blanc)", calories: 165, protein: 31, unit: "100g", img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200" },
  { id: 'f2', name: "Riz Basmati Cuit", calories: 130, protein: 2.7, unit: "100g", img: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200" },
  { id: 'f3', name: "Oeuf entier", calories: 155, protein: 13, unit: "unité", img: "https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=200" },
  { id: 'f4', name: "Flocons d'Avoine", calories: 389, protein: 16.9, unit: "100g", img: "https://images.unsplash.com/photo-1517093725460-ea6920d6931d?w=200" },
  { id: 'f5', name: "Banane", calories: 89, protein: 1.1, unit: "unité", img: "https://images.unsplash.com/photo-1571771896338-a0752055396e?w=200" },
  { id: 'f6', name: "Pâtes Complètes", calories: 350, protein: 12, unit: "100g (cru)", img: "https://images.unsplash.com/photo-1612966874574-e0a92d878ef4?w=200" },
  { id: 'f7', name: "Avocat", calories: 160, protein: 2, unit: "unité", img: "https://images.unsplash.com/photo-1523049673856-38225547e087?w=200" },
  { id: 'f8', name: "Amandes", calories: 579, protein: 21, unit: "100g", img: "https://images.unsplash.com/photo-1508061253366-f7da158b6d90?w=200" },
  { id: 'f9', name: "Saumon", calories: 208, protein: 20, unit: "100g", img: "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=200" },
  { id: 'f10', name: "Brocolis", calories: 34, protein: 2.8, unit: "100g", img: "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=200" },
];
