import React from 'react'

interface PretitleProps {
  text: string;
  center?: boolean;
}

const Pretitle: React.FC<PretitleProps> = ({ text, center = false }) => {
  return (
    <div className={`flex items-center gap-3 mb-4 ${center ? "justify-center" : ""}`}>
        <div className="w-2 h-2 bg-primary"></div>
        <p className='font-primary tracking-[3.2px] uppercase'>{text}</p>
        <div className='w-2 h-2 bg-primary'></div>
    </div>
  )
}

export default Pretitle