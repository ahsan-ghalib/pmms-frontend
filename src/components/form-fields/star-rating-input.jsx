
import { useEffect, useState } from 'react';

const StarRatingInput = ({ label, name, register, setValue, error, value, validation = {} }) => {
  const [rating, setRating] = useState(value || 0);

  // Sync local rating state with value prop
  useEffect(() => {
    setRating(Number(value) || 0);
  }, [value]);

  const handleSelect = (val) => {
    setRating(val);
    setValue(name, val);
  };

  return (
    <div className="flex flex-col space-y-1 mt-2">
      <label className="font-medium">
        {label}
        {validation?.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex space-x-1">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            onClick={() => handleSelect(i + 1)}
            className={`cursor-pointer text-2xl ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
      <input type="hidden" {...register(name, { required: 'Rating is required' })} />
      {error && <p className="text-red-500 text-sm">{error.message}</p>}
    </div>
  );
};

export default StarRatingInput;
