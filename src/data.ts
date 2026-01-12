// --- BASE DE DONNÉES (SOURCE: CIQUAL ANSES / PDF 30JPS) ---

export interface Exercise {
  id: string;
  name: string;
  equipment: string;
  cat: string;
  img: string;
}

export interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number; // Glucides
  fat: number;   // Lipides
  unit: string;
  img: string;
}

export const INITIAL_EXERCICES: Exercise[] = [
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

export const INITIAL_FOODS: Food[] = [
  // --- FÉCULENTS ---
  { id: 'f1', name: "Riz Basmati (Cuit)", calories: 117, protein: 2.7, carbs: 24.4, fat: 0.5, unit: "100g", img: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200" },
  { id: 'f2', name: "Pâtes / Spaghetti (Cuits)", calories: 140, protein: 4.8, carbs: 28, fat: 0.6, unit: "100g", img: "https://images.unsplash.com/photo-1612966874574-e0a92d878ef4?w=200" },
  { id: 'f3', name: "Flocons d'Avoine", calories: 367, protein: 13, carbs: 58, fat: 7, unit: "100g", img: "https://images.unsplash.com/photo-1517093725460-ea6920d6931d?w=200" },
  { id: 'f4', name: "Pomme de Terre (Cuite)", calories: 80, protein: 1.8, carbs: 17, fat: 0.3, unit: "100g", img: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200" },
  { id: 'f5', name: "Patate Douce (Cuite)", calories: 63, protein: 1.6, carbs: 12, fat: 0.15, unit: "100g", img: "https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?w=200" },
  { id: 'f6', name: "Quinoa (Cuit)", calories: 116, protein: 4.1, carbs: 20, fat: 1.8, unit: "100g", img: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200" },
  { id: 'f7', name: "Lentilles (Cuites)", calories: 116, protein: 9, carbs: 13, fat: 0.6, unit: "100g", img: "https://images.unsplash.com/photo-1515543904379-3d757afe72e3?w=200" },
  { id: 'f8', name: "Pain Complet", calories: 245, protein: 9, carbs: 45, fat: 1.5, unit: "100g", img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200" },

  // --- PROTÉINES ---
  { id: 'p1', name: "Blanc de Poulet (Cuit)", calories: 137, protein: 29, carbs: 0, fat: 1.8, unit: "100g", img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200" },
  { id: 'p2', name: "Steak Haché 15% (Cuit)", calories: 239, protein: 26, carbs: 0, fat: 15, unit: "100g", img: "https://images.unsplash.com/photo-1603048297172-c92544798d5e?w=200" },
  { id: 'p3', name: "Oeuf Dur (Unité)", calories: 78, protein: 6, carbs: 0.5, fat: 5, unit: "unité", img: "https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=200" },
  { id: 'p4', name: "Filet de Colin (Cuit)", calories: 85, protein: 19, carbs: 0, fat: 1, unit: "100g", img: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=200" },
  { id: 'p5', name: "Pavé de Saumon (Cuit)", calories: 205, protein: 23, carbs: 0, fat: 13, unit: "100g", img: "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=200" },
  { id: 'p6', name: "Thon Nature (Boîte)", calories: 110, protein: 25, carbs: 0, fat: 1, unit: "100g", img: "https://images.unsplash.com/photo-1588720336262-63234479e07f?w=200" },
  { id: 'p7', name: "Crevettes (Cuites)", calories: 90, protein: 21, carbs: 0, fat: 1, unit: "100g", img: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=200" },
  { id: 'p8', name: "Tofu Nature", calories: 100, protein: 11, carbs: 2, fat: 5, unit: "100g", img: "https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=200" },

  // --- LÉGUMES & FRUITS ---
  { id: 'v1', name: "Brocoli (Cuit)", calories: 30, protein: 3, carbs: 2, fat: 0.5, unit: "100g", img: "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=200" },
  { id: 'v2', name: "Haricot Vert (Cuit)", calories: 30, protein: 1.5, carbs: 3, fat: 0.2, unit: "100g", img: "https://images.unsplash.com/photo-1591189320853-43c7b2e34743?w=200" },
  { id: 'v3', name: "Courgette (Cuite)", calories: 20, protein: 1, carbs: 2, fat: 0.3, unit: "100g", img: "https://images.unsplash.com/photo-1569325997230-22c6020f0c9f?w=200" },
  { id: 'v4', name: "Avocat (Chair)", calories: 160, protein: 2, carbs: 2, fat: 15, unit: "100g", img: "https://images.unsplash.com/photo-1523049673856-38225547e087?w=200" },
  { id: 'fr1', name: "Pomme", calories: 52, protein: 0.3, carbs: 12, fat: 0.2, unit: "100g", img: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=200" },
  { id: 'fr2', name: "Banane", calories: 90, protein: 1, carbs: 20, fat: 0.3, unit: "unité", img: "https://images.unsplash.com/photo-1571771896338-a0752055396e?w=200" },

  // --- LAITAGES & GRAISSES ---
  { id: 'l1', name: "Fromage Blanc 3%", calories: 75, protein: 8, carbs: 3.5, fat: 3, unit: "100g", img: "https://images.unsplash.com/photo-1627372276536-41951994e636?w=200" },
  { id: 'l2', name: "Yaourt Nature", calories: 50, protein: 4, carbs: 5, fat: 1, unit: "125g", img: "https://images.unsplash.com/photo-1571212515416-f78322c3639d?w=200" },
  { id: 'l3', name: "Mozzarella", calories: 260, protein: 18, carbs: 2, fat: 20, unit: "100g", img: "https://images.unsplash.com/photo-1582296530638-b7c4a3237a3f?w=200" },
  { id: 'g1', name: "Amandes", calories: 625, protein: 23, carbs: 9.5, fat: 51, unit: "100g", img: "https://images.unsplash.com/photo-1508061253366-f7da158b6d90?w=200" },
  { id: 'g2', name: "Chocolat Noir 70%", calories: 570, protein: 8, carbs: 32, fat: 42, unit: "100g", img: "https://images.unsplash.com/photo-1548943487-a2e4e43b485c?w=200" },
  { id: 'g3', name: "Huile d'Olive", calories: 900, protein: 0, carbs: 0, fat: 100, unit: "100g", img: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200" },
];
