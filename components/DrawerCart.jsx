import { useState } from 'react';
import { Drawer } from '@mui/material';
import Box from '@mui/material/Box';

export default function DrawerMenu({ trigger }) {
  const [open, setOpen] = useState(false);

  const toggleDrawer = (state) => () => {
    setOpen(state);
  };

  return (
    <>
      <div onClick={toggleDrawer(true)} >
        {trigger.content}
      </div>

      <Drawer open={open} anchor="right" onClose={toggleDrawer(false)}>
        <Box sx={{ width: 400 }} role="presentation" onClick={toggleDrawer(false)}>
          {/* Drawer content goes here */}
        </Box>
      </Drawer>
    </>
  );
}
