import React, {useRef} from 'react';

import {Table, Header, Container, Divider, Icon } from 'semantic-ui-react';





class ObjTable extends React.Component {

    constructor(props) {
        super(props);

        this.tableData = [];


    }

    update() {
        this.tableData.map((item,index) => {
            <Table.Row key={record.RelocationId}>
            <Table.Cell>{item.index}</Table.Cell>
            <Table.Cell>{item.x}</Table.Cell>
            <Table.Cell>{item.y}</Table.Cell>
            <Table.Cell>{item.dx}</Table.Cell>
            <Table.Cell>{item.dy}</Table.Cell>
            <Table.Cell>{item.mass}</Table.Cell>
            <Table.Cell>{item.radius}</Table.Cell>


        </Table.Row>
        })
        
    }
    

    render() {
        return (
            <Table celled singleLine compact sortable selectable >
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>object #</Table.HeaderCell>
                        <Table.HeaderCell>x</Table.HeaderCell>
                        <Table.HeaderCell>y</Table.HeaderCell>
                        <Table.HeaderCell>dx</Table.HeaderCell>
                        <Table.HeaderCell>dy</Table.HeaderCell>
                        <Table.HeaderCell>mass</Table.HeaderCell>
                        <Table.HeaderCell>radius</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                {children}
            </Table>
        );
        
    }
}
export default ObjTable;
