import React, { Component } from 'react';
import styles from './PointsList.css'

export default class PointsList extends Component {

    render() {
        const { points } = this.props;

        return (
            <ul id="style-3" className='points-list'>
                {points.map(point => <li className='point'>{point}</li>)}
            </ul>
        );
    }
}