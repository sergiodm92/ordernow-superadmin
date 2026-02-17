import { useState, useCallback } from 'react';

const usePasswordGenerator = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const generatePassword = useCallback(() => {
    try {
      // Definir los conjuntos de caracteres
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      const specials = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      // Asegurar al menos un carácter de cada tipo requerido
      const mandatoryParts = [
        lowercase[Math.floor(Math.random() * lowercase.length)], // Una minúscula
        uppercase[Math.floor(Math.random() * uppercase.length)], // Una mayúscula
        specials[Math.floor(Math.random() * specials.length)], // Un carácter especial
      ];
      
      // Combinar todos los caracteres posibles
      const allChars = lowercase + uppercase + numbers + specials;
      
      // Completar los 7 caracteres restantes para llegar a 10
      const remainingLength = 10 - mandatoryParts.length;
      let remainingParts = [];
      for (let i = 0; i < remainingLength; i++) {
        remainingParts.push(allChars[Math.floor(Math.random() * allChars.length)]);
      }
      
      // Combinar y mezclar
      const combined = [...mandatoryParts, ...remainingParts];
      const shuffled = combined.sort(() => Math.random() - 0.5).join('');
      
      setPassword(shuffled);
      setError('');
      return shuffled;
    } catch (err) {
      setError('Error al generar la contraseña');
      console.error(err);
      return '';
    }
  }, []);

  return { password, setPassword, generatePassword, error };
};

export default usePasswordGenerator;