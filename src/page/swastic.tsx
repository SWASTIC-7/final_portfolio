import { useState } from 'react';
import Project from '../components/project/project';
import Contact from '../components/contact/contact';
import About from '../components/about/About';
import Home from '../components/home/home';

import './Swastic.css'

function Swastic() {
  

  return (
    <>
      <div className='wrapper'>
      <Home />
      <About />
     {/* <Project /> */}
     <Contact />
     </div>
    </>
  )
}

export default Swastic
