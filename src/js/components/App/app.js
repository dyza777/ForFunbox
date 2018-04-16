import React, { Component } from 'react';
import styles from './app.css';
import PointsList from '../PointsList/PointsList';

export default class App extends Component {

    state = {
        points: [],
        inputValue: ''
    }

    render() {
        const { points, inputValue } = this.state;
        console.log(points)

        return (
            <div className='main'>
                <input onChange={this.handleChangeInput} value={inputValue} onKeyUp={this.handleInputSubmit}/>
                <PointsList points={points} />
            </div>
        );
    }

    handleInputSubmit = (event) => {
        if (event.target.value && event.keyCode === 13) {
            const newPoints = this.state.points.slice();
            newPoints.push(event.target.value);
            this.setState({
                points: newPoints,
                inputValue: ''
            })
        }
    };

    handleChangeInput = (event) => this.setState({ inputValue: event.target.value});
}