import React from 'react';


import { Button, Checkbox, Form } from 'semantic-ui-react';

function BasicForm() {
	return (
	<Layout>
		<Form>
		
			<Form.Field label='First Name' control='input' id="firstName">
				<input placeholder="First Name" />
			</Form.Field>
			
			
			<Form.Field label='Last Name' control='input' id="lastName">
				<input placeholder="Last Name" />
			</Form.Field>
			
			
			<Form.Field label='Gender' control='select' id="gender">
				<option value="Male"> Male </option>
				<option value="Female"> Female </option>
			</Form.Field>
			
			<Form.Field label='Date of Birth' control='input' id="birthday">
				//<input type="text" pattern="([0-1]{0,1})([0,9]{1})(\/)([0-3]{0,1})([0,9]{1})(\/)([0-9]{4})" />
			</Form.Field>
			
			<Form.Field label='Hometown' control='input' id = "hometown"/>
			
			<Form.Field label='Submit' control='button'>
				Submit
			</Form.Field>
		</Form>
	</Layout>
	);
		
}

export default BasicForm; 

