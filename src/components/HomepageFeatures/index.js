import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Hi there 👋',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        I'm Ryao, a master student in control engineering. <br /> 
        
        I'm currently working on Computer Graphics (simulation, rendering) and Digital Twins Modeling. <br />

        How to reach me: lilkotyo@gmail.com or lil-kotyo@sjtu.edu.cn. <br />
        
        Contact me if you are interested in graphics and have related topics to discuss! <br />
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
