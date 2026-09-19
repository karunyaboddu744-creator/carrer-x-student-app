import React from 'react';
export default function SectionHeader({eyebrow,title,description,action}){return <div className="section-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description&&<p>{description}</p>}</div>{action}</div>}
