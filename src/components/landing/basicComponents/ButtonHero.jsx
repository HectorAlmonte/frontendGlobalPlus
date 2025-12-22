import React from 'react'
import {RiArrowRightUpLine} from 'react-icons/ri'
const ButtonHero = ({text}) => {
  return (
    <button className='w-[210px] h-[54px] py-[5px] flex itmes-center justify-betwwen min-w-[200px] gropu bg-accent'>
        <div className='flex-1 text-center traking-[1.2px] font-primary font-bold text-primary text-sm uppercase'>{text}</div>
        <div className='w-11 h-11 bg-primary flex items-center justify-center'>
            <RiArrowRightUpLine className='text-white text-xl group-hover:rotate-45 transition-all duration-200'/>
        </div>
    </button>
  )
}

export default ButtonHero