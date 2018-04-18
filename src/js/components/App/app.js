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
            currentRoute: null,
            draggableInitialCoords: null,
            isError: false
        }

        this.map = null;
    }



    render() {
        const { points, inputValue, isError } = this.state;

        return (
            <div className='main'>
                <div className='ui'>
                    <input onChange={this.handleChangeInput} value={inputValue} onKeyUp={this.handleInputSubmit}/>
                    <PointsList sortPoints={this.sortPoints} deletePoint={this.deletePoint} points={points} />
                </div>
                { isError &&
                    <span className='error'> Не удалось простроить маршрут :( </span>
                }
                <div id='map' />
            </div>
        );
    }

    sortPoints = ({oldIndex, newIndex}) => {
        if (this.state.points.length < 2) return;
        this.map.geoObjects.removeAll();
        const newPoints = arrayMove(this.state.points, oldIndex, newIndex);

        window.ymaps.route(newPoints)
            .then(route => this.handleAddRoute(route))
            .catch(err => this.routeBuildingError(err, newPoints))
        
        this.setState({
          points: newPoints
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

    handleAddRoute = (route, newPoints) => {
        this.map.geoObjects.add(route);
        this.setState({currentRoute: route, draggableInitialCoords: null});
        if (newPoints) {
            this.setState({ points: newPoints})
        }
        route.getWayPoints().each(point => {
            point.events.add('dragend', (e) => this.pointDragEnd(point));
            point.events.add('dragstart', (e) => this.pointDragStart(point));
        });
        route.getWayPoints().options.set({
            draggable: true
        });

        this.setState({ isError: false })
    }

    pointDragEnd = (point) => {
        const pointIndex = point.properties.get('iconContent') - 1;
        window.ymaps.geocode(point.geometry.getCoordinates())
            .then(result => {
                const newPoints = this.state.points.slice();

                this.map.geoObjects.removeAll();

                newPoints.splice(pointIndex, 1, result.geoObjects.get(0).properties.get('text'));

                if (newPoints.length === 1) {
                    this.setState({ points: newPoints });
                    var placemark = new window.ymaps.Placemark(result.geoObjects.get(0).geometry.getCoordinates(), { 
                        iconContent: 1,
                        balloonContent: result.geoObjects.get(0).properties.get('text')
                    }, { draggable: true });
                    this.map.geoObjects.add(placemark);
                    placemark.events.add('dragstart', (e) => this.pointDragStart(placemark));
                    placemark.events.add('dragend', (e) => this.pointDragEnd(placemark));
                    return;
                }

                window.ymaps.route(newPoints)
                    .then(route => this.handleAddRoute(route, newPoints))
                    .catch(err => this.routeBuildingError(err, point));
            })
    };

    pointDragStart = point => {
        this.setState({ draggableInitialCoords: point.geometry.getCoordinates()})
    }

    routeBuildingError = (err, dragPoint) => {
        console.log(err);
        this.map.geoObjects.add(this.state.currentRoute);
        if (this.state.draggableInitialCoords && dragPoint) {
            dragPoint.geometry.setCoordinates(this.state.draggableInitialCoords)
        }

        this.setState({ isError: true })
    }

    handleInputSubmit = (event) => {
        event.persist();
        if (event.target.value && event.keyCode === 13) {
            this.setState({ inputValue: ''})
            const reqLocation = event.target.value;
            console.log(event.target.value)
            const request = window.ymaps.geocode(reqLocation);
            request.then(res => {
                if (!res.geoObjects.get(0)) {
                    return Promise.reject()
                }

                this.map.geoObjects.removeAll()

                const newPoints = this.state.points.slice();

                newPoints.push(res.geoObjects.get(0).properties.get('text'));

                this.setState({
                    points: newPoints
                });

                this.map.panTo(res.geoObjects.get(0).geometry.getCoordinates(), {flying: true})

                if (newPoints.length < 2) {
                    var placemark = new window.ymaps.Placemark(res.geoObjects.get(0).geometry.getCoordinates(), { 
                        iconContent: 1,
                        balloonContent: res.geoObjects.get(0).properties.get('text')
                    }, { draggable: true });
                    this.map.geoObjects.add(placemark);
                    placemark.events.add('dragstart', (e) => this.pointDragStart(placemark));
                    placemark.events.add('dragend', (e) => this.pointDragEnd(placemark));
                    return;
                }

                window.ymaps.route(newPoints)
                    .then(route => this.handleAddRoute(route))
                    .catch(err => this.routeBuildingError(err, null))
            
            })
        }
    };

    deletePoint = (value ,event) => {
        event.preventDefault();
        event.stopPropagation()
        const newPoints = this.state.points.slice();

        this.map.geoObjects.removeAll();

        const pointToDelete = newPoints.find(point => point === value);

        newPoints.splice(newPoints.indexOf(pointToDelete), 1);

        if (!newPoints.length) {
            this.setState({
                points: [],
            });
            return;
        }

        if (newPoints.length === 1) {
            window.ymaps.geocode(newPoints[0])
                .then(res => {
                    var placemark = new window.ymaps.Placemark(res.geoObjects.get(0).geometry.getCoordinates(), { 
                        iconContent: 1,
                        balloonContent: res.geoObjects.get(0).properties.get('text')
                    }, { draggable: true});
                    this.map.geoObjects.add(placemark);
                    placemark.events.add('dragstart', (e) => this.pointDragStart(placemark));
                    placemark.events.add('dragend', (e) => this.pointDragEnd(placemark));

                    this.setState({
                        points: newPoints,
                        currentRoute: null
                    });
                })
            return;
        }

        window.ymaps.route(newPoints)
            .then(route => this.handleAddRoute(route))
            .catch(err => this.routeBuildingError(err, null));

        this.setState({
            points: newPoints,
        });
    }

    handleChangeInput = (event) => this.setState({ inputValue: event.target.value});
}