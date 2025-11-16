// CREDIT
// Component inspired from Can Tastemel's original work for the lambda.ai landing page
// https://cantastemel.com
  
import Cubes from './Cubes'

// CONTACT text pattern - 1 means rotate the cube
const contactPattern = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,1,1,1,0,1,1,1,1,1,0,1,0,0,0,1,0,1,1,1,1,1,0,0,0,1,0,0,0,0,1,1,1,0,1,1,1,1,1,0,0],
  [0,1,0,0,0,0,1,0,0,0,1,0,1,1,0,0,1,0,0,0,1,0,0,0,0,1,1,1,0,0,1,0,0,0,0,0,0,1,0,0,0,0],
  [0,1,0,0,0,0,1,0,0,0,1,0,1,0,1,0,1,0,0,0,1,0,0,0,0,1,1,1,0,0,1,0,0,0,0,0,0,1,0,0,0,0],
  [0,1,0,0,0,0,1,0,0,0,1,0,1,0,0,1,1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,0,0,0,1,0,0,0,0],
  [0,0,1,1,1,0,1,1,1,1,1,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1,1,1,0,0,0,1,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,-1,0,0,0,0,0,-1,0,0,0,0,0,-1,0,0,0,0,0,-1,0,0,0,0,0,-1,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],

];

const logoMapping: Record<string, string> = {
  '9-8': '/linkedin.png',
  '9-14': '/github.png',
  '9-20': '/twitter.png',
  '9-26': '/discord.png',
  '9-32': '/email.png',
};

const logoLinks: Record<string, string> = {
  '9-8': 'https://www.linkedin.com/in/swastic-keshari-77418827a/',
  '9-14': 'https://github.com/SWASTIC-7',
  '9-20': 'https://x.com/swastic_07',
  '9-26': 'https://tinyurl.com/swastic-discord',
  '9-32': 'https://mail.google.com/mail/?view=cm&fs=1&to=incredibleswastic@gmail.com',
};

export const Contact = () => (
  <div className="Contact" style={{ margin: '0',height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', position: 'relative', background: '#000' }}>
    <Cubes 
      cubeSize={25}
      maxAngle={120}
      radius={3}
      cellGap={12}
      borderStyle="1px dashed #c0c0c0"
      faceColor="black"
      highlightColor="#3e3b3bff"
      rippleColor="#7f1212ff"
      rippleSpeed={2}
      autoAnimate={false}
      rippleOnClick={true}
      textPattern={contactPattern}
      logoMapping={logoMapping}
      logoLinks={logoLinks}
    />
  </div>
);
export default Contact;