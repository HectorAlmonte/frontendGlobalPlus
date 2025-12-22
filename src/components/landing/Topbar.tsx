import React from 'react'
import {RiPhoneFill, RiMailFill} from 'react-icons/ri'
import Social from './Social'

const Topbar = () => {
  return (
    <section className='py-4 xl:hl-16 xl:py-8 bg-gradient-to-t from-[#ffc221] to-[#ffd76e] flex ites-center'id='home'>
      <div className="container mx-auto">
        {/* phone, mail & social*/}
        <div className="flex flex-col lg:flex-row itmes-center justify-betwwen gap-6">
          <div className="hidden xl:flex items-center gap-8">
            {/* phone */}
            <div className="flex items-center gap-3">
              <div className='w-8 h-8 bg-primary text-white flex items-center justify-center'>
                <RiPhoneFill/>
              </div>
              <p className='font-medium text-primary'>953 304 234</p>
            </div>
            {/* mail */}
            <div className="flex items-center gap-3">
              <div className='w-8 h-8 bg-primary text-white flex items-center justify-center'>
                <RiMailFill/>
              </div>
              <p className='font-medium text-primary'>mail@globalplus.com</p>
            </div>
            <Social containerStyles="flex items-center gap-8 mx-aut xl:mx-0" iconStyles='text-primary'></Social>
          </div>
        </div>
      </div>
    </section>
  )
};

export default Topbar;