import React, { Component } from 'react';
import styles from './app.css';
import PointsList from '../PointsList/PointsList';
import { arrayMove } from 'react-sortable-hoc'

export default class App extends Component {

    componentDidMount() {
        window.ymaps.ready(this.initYandexMap);
    }

    constructor(props) {
        super(props);
        this.state = {
            points: [],
            inputValue: '',
            currentLine: null
        }

        this.map = null;
    }



    render() {
        const { points, inputValue } = this.state;

        return (
            <div className='main'>
                <div className='ui'>
                    <input onChange={this.handleChangeInput} value={inputValue} onKeyUp={this.handleInputSubmit}/>
                    <PointsList sortPoints={this.sortPoints} deletePoint={this.deletePoint} points={points} />
                </div>
                <div id='map' />
            </div>
        );
    }

    putPlacemark = (point, index) => {
        var placemark = new window.ymaps.Placemark(point.coords, { 
            iconContent: index,
            balloonContent: `<div><strong>${point.title}</strong><p>${point.address}</p></div>`
        }, { draggable: true });
        this.map.geoObjects.add(placemark);
        placemark.events.add('dragend', (e) => this.pointDragEnd(placemark));

        return placemark;
    };

    buildNewLine = newPoints => {
        const line = new window.ymaps.Polyline(newPoints.map(point => point.coords))

        this.map.geoObjects.remove(this.state.currentLine);
        this.map.geoObjects.add(line);

        return line;
    }

    sortPoints = ({oldIndex, newIndex}) => {
        if (this.state.points.length < 2) return;
        const newPoints = arrayMove(this.state.points, oldIndex, newIndex);

        newPoints.forEach((point, index) => point.placemark.properties.set({
            iconContent: index + 1
        }));

        const line = this.buildNewLine(newPoints);
        
        this.setState({
          points: newPoints,
          currentLine: line
        });
      };

    initYandexMap = () => {
        const myMap = new ymaps.Map("map", {
            center: [55.76, 37.64],
            zoom: 7,
            behaviors: ['scrollZoom', 'drag']
        });

        this.map = myMap;
    }

    pointDragEnd = (point) => {
        const pointIndex = point.properties.get('iconContent') - 1;
        window.ymaps.geocode(point.geometry.getCoordinates())
            .then(result => {
                const newPoints = this.state.points.slice();

                const updatedPoint = {
                    title: newPoints[pointIndex].title,
                    address: result.geoObjects.get(0).properties.get('text'),
                    coords: point.geometry.getCoordinates(),
                    placemark: point
                }

                newPoints.splice(pointIndex, 1, updatedPoint);

                point.properties.set({
                    balloonContent: `<div><strong>${updatedPoint.title}</strong><p>${updatedPoint.address}</p></div>`
                })

                const line = this.buildNewLine(newPoints);
                
                this.setState({
                    points: newPoints,
                    currentLine: line
                });
            })            
    }

    handleInputSubmit = (event) => {
        event.persist();
        if (event.target.value && event.keyCode === 13) {
            const reqValue = event.target.value;
            this.setState({ ...this.state, inputValue: '' })
            const request = window.ymaps.geocode(this.map.getCenter());
            request.then(res => {
                const firstRes = res.geoObjects.get(0);
                const newPoints = this.state.points.slice();
                const newPoint = {
                    title: reqValue,
                    address: firstRes.properties.get('text'),
                    coords: this.map.getCenter()
                }

                const placemark = this.putPlacemark(newPoint, newPoints.length + 1);

                newPoints.push({ ...newPoint, placemark });

                const line = this.buildNewLine(newPoints);

                this.setState({
                    points: newPoints,
                    currentLine: line
                });
            })
        }
    };

    deletePoint = (value ,event) => {
        event.preventDefault();
        event.stopPropagation()
        const newPoints = this.state.points.slice();

        const pointToDelete = newPoints.find(point => point.title === value);

        this.map.geoObjects.remove(newPoints[newPoints.indexOf(pointToDelete)].placemark);

        newPoints.splice(newPoints.indexOf(pointToDelete), 1);

        newPoints.forEach((point, index) => point.placemark.properties.set({
            iconContent: index + 1
        }))

        if (!newPoints.length) {
            this.setState({
                points: [],
                currentLine: null
            });
            return;
        }

        const line = this.buildNewLine(newPoints);

        this.setState({
            points: newPoints,
            currentLine: line
        });
    }

    handleChangeInput = (event) => this.setState({ inputValue: event.target.value});
}