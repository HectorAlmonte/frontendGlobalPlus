import React from 'react'
import LandingButton from '../ui/LandingButton'
import { RiArrowRightUpLine } from 'react-icons/ri'

interface ButtonHeroProps {
  text: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

const ButtonHero: React.FC<ButtonHeroProps> = ({ 
  text, 
  onClick, 
  type = 'button', 
  disabled = false 
}) => {
  return (
    <LandingButton
      variant="hero"
      size="hero"
      onClick={onClick}
      type={type}
      disabled={disabled}
      icon={<RiArrowRightUpLine className='text-white text-xl' />}
    >
      {text}
    </LandingButton>
  )
}

export default ButtonHero