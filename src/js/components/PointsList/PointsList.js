import React, { Component } from 'react';
import styles from './PointsList.css'
import { SortableContainer, SortableElement } from 'react-sortable-hoc';

const SortableItem = SortableElement(({value, deletePoint, index}) => (
    <li draggable className='point'>
        <span className='point-text'> {value} </span>
        <i className="cross-icon" onClick={(event) => deletePoint(value, event)}></i>
    </li>
));

const SortableList = SortableContainer(({items, deletePoint}) => {
  return (
    <ul id="style-3" className='points-list'>
      {items.map((value, index) => (
        <SortableItem deletePoint={deletePoint} key={`item-${index}`} index={index} value={value} />
      ))}
    </ul>
  );
});

export default class PointsList extends Component {

    render() {
        const { points, deletePoint, sortPoints } = this.props;

        return (
            <SortableList
                shouldCancelStart={event => event.path[0].tagName === 'I'}
                lockAxis='y'
                helperClass='helper'
                deletePoint={deletePoint}
                items={points}
                onSortEnd={sortPoints}
            />
        );
    }
}