import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: '你好!👋',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        我是Ryao，目前在上海交通大学控制科学与工程专业攻读硕士学位。 <br />

        我目前主要研究方向是计算机图形学（模拟、渲染）和数字孪生建模。 <br />

        我的邮箱：lilkotyo@gmail.com, lil-kotyo@sjtu.edu.cn. <br />

        如果你对图形学感兴趣，欢迎联系我！ <br />
      </>
    ),
  },
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
    <div className={clsx('col col--6')}>
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
