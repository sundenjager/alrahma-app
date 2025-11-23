import React from 'react';
import './internalRegulations.css';

const InternalRegulations = () => {
  

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">النظام الداخلي للجمعية</h1>
      </div>
      
      <div className="w-full h-screen">
        <iframe
          src="../../../public/النظام الداخلي.pdf#zoom=50"
          title="النظام الداخلي للجمعية"
          width="100%"
          height="1000vh"
          style={{ border: 'none' }}
        >
          <p>Your browser does not support PDFs. 
            <a href="/assets/النظام الداخلي.pdf">Download the PDF</a> instead.
          </p>
        </iframe>
      </div>
    </div>
  );
};

export default InternalRegulations;